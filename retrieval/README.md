RAG retrieval helper

Files in this folder:
- `data/` - seed documents (NEI, NHS, WHO) used for retrieval
- `retriever.py` - lightweight retriever that uses sentence-transformers + FAISS when available, otherwise a simple bag-of-words fallback
- `build_index.py` - script to build the index

Quick start
1. Install dependencies (recommended):
```
pip install sentence-transformers faiss-cpu
```
2. Build the index:
```
python retrieval/build_index.py
```
3. The backend will call `retrieval.retrieve(query,k=3)` automatically if the module is importable.

Notes
- For a production setup, expand `retrieval/data/` with more authoritative documents (PubMed reviews, AAO guidelines, etc.).
- Consider using an external vector DB (Weaviate, Pinecone, Chroma) for scalability.
