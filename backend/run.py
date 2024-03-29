import logging
import os
import openai
from flask import Flask, jsonify, request
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
#import psycopg2
import re
import logging
logging.basicConfig(level=logging.INFO)
from dotenv import load_dotenv
load_dotenv()
from flask_cors import CORS
app = Flask(__name__)
cors = CORS(app)


AZURE_SEARCH_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT")
logging.info("azuresearchendpoint: %s ",AZURE_SEARCH_ENDPOINT)
AZURE_SEARCH_INDEX_NAME = os.getenv("AZURE_SEARCH_INDEX_NAME")
logging.info("azuresearchindex: %s ",AZURE_SEARCH_INDEX_NAME)
AZURE_SEARCH_API_KEY = os.getenv("AZURE_SEARCH_API_KEY")
num_results = int(os.getenv("NO_OF_COGNITIVE_SEARCH_RESULTS","3"))

openai.api_type = os.getenv("OPENAI_API_TYPE")
openai.api_key = os.getenv("OPENAI_API_KEY")
openai.api_base = os.getenv("OPENAI_API_BASE")
openai.api_version = os.getenv("OPENAI_API_VERSION")

# DATABASE_PREFIX = os.getenv("DATABASE_PREFIX")
# DATABASE_HOST = os.getenv("DATABASE_HOST")
# CONTAINER_DATABASE_PORT = os.getenv("CONTAINER_DATABASE_PORT")
# DATABASE_USER = os.getenv("DATABASE_USER")
# DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")
# DATABASE_NAME = os.getenv("DATABASE_NAME")

# connection = psycopg2.connect(
#     host=DATABASE_HOST,
#     port=CONTAINER_DATABASE_PORT,
#     user=DATABASE_USER,
#     password=DATABASE_PASSWORD,
#     database=DATABASE_NAME
# )


def search_azure_index(query):
    credential = AzureKeyCredential(AZURE_SEARCH_API_KEY)
    search_client = SearchClient(endpoint=AZURE_SEARCH_ENDPOINT,
                                 index_name=AZURE_SEARCH_INDEX_NAME,
                                 credential=credential)

    results = search_client.search(search_text=query)

    relevant_info_list = []

    for result in results:
        content = result.get("content", "")
        url = result.get("url", "")
        filepath = result.get("filepath", "")
        content = re.sub(r'[\n\r\\\/]+', ' ', content)

        relevant_info_list.append({
            "content": content,
            "url": url,
            "filepath": filepath
        })

        if len(relevant_info_list) >= num_results:
            break

    return relevant_info_list

@app.route("/api/prompt_route", methods=["GET", "POST"])
def prompt_route():
    user_prompt = request.json.get("query", None)

    prompt_response_dict = {
        "Prompt": user_prompt,
        "Answer": "",
        "Sources": [] 
    }
    status_code = 500

    if user_prompt:
        print(f'User Prompt: {user_prompt}')
        azure_search_result = search_azure_index(user_prompt)

        response = openai.ChatCompletion.create(
            model=os.getenv("OPENAI_MODEL_NAME"),
            engine=os.getenv("OPENAI_DEPLOYMENT_NAME"),
            messages=[
                {"role": "system", "content": os.getenv("CnA_SYSTEM_PROMPT")},
                {"role": "user", "content": " ".join([result["content"] for result in azure_search_result])},
                {"role": "assistant", "content": user_prompt}
            ]
        )
        prompt_response_dict["Answer"] = response.get("choices")[0]["message"]["content"]
        sources = []
        for result in azure_search_result:
            filepath = result["filepath"]
            sources.append({"Content": result["content"], "Path": filepath})

        #     with connection.cursor() as cursor:
        #         cursor.execute("SELECT remotepath FROM administrator_source_file_reference WHERE localpath LIKE %s", ('%' + filepath,))
        #         remote_path = cursor.fetchone()

        #     if remote_path:
        #         sources.append({"Content": result["content"], "Path": filepath, "filepath": remote_path[0]})
        #     else:
        #         sources.append({"Content": result["content"], "Path": filepath, "filepath1": "Not found in the database"})

        prompt_response_dict["Sources"] = sources

        status_code = 200
    return jsonify(prompt_response_dict), status_code

if __name__ == "__main__":
    logging.basicConfig(
        format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s", level=logging.INFO
    )
    app.run(host=os.getenv("GPT_API_HOST"), port=os.getenv("GPT_API_PORT"), debug=False)
