from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.vectorstores import FAISS
from langchain_core.tools import create_retriever_tool
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain import hub

# 1. Setup your Knowledge Bank Retriever (Local Vector Store)
embeddings = OpenAIEmbeddings()
vectorstore = FAISS.load_local("my_knowledge_bank", embeddings)
knowledge_retriever = vectorstore.as_retriever()

# 2. Convert Knowledge Bank into an Agent Tool
knowledge_tool = create_retriever_tool(
    knowledge_retriever,
    "search_knowledge_bank",
    "Searches and retrieves internal documents and local company data."
)

# 3. Define the Web Search Tool
web_search_tool = TavilySearchResults(max_results=3)

# 4. Combine Tools
tools = [knowledge_tool, web_search_tool]

# 5. Initialize Agent & Model
llm = ChatOpenAI(model="gpt-4o", temperature=0)
prompt = hub.pull("hwchase17/openai-tools-agent")
agent = create_openai_tools_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# 6. Query your App
response = agent_executor.invoke({
    "input": "Check our internal policy for remote work and search online for the latest 2026 travel guidelines."
})
print(response["output"])