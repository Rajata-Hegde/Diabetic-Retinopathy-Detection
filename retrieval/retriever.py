import os
import json
from pathlib import Path
try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    import faiss
    HAS_EMBED = True
except Exception:
    HAS_EMBED = False

DATA_DIR = Path(__file__).resolve().parent / "data"
INDEX_PATH = Path(__file__).resolve().parent / "index.npz"

def _load_documents(data_dir=DATA_DIR):
    docs = []
    for p in sorted(Path(data_dir).glob('*.txt')):
        raw = p.read_text(encoding='utf-8')
        # simple metadata parse
        meta = {}
        lines = raw.splitlines()
        if lines and lines[0].startswith('source_url:'):
            meta['url'] = lines[0].split(':',1)[1].strip()
        if len(lines) > 1 and lines[1].startswith('source_title:'):
            meta['title'] = lines[1].split(':',1)[1].strip()
        text = '\n'.join(lines[2:]).strip()
        docs.append({
            'id': p.stem,
            'title': meta.get('title', p.stem),
            'url': meta.get('url',''),
            'text': text
        })
    return docs

def build_index(model_name='all-MiniLM-L6-v2', data_dir=DATA_DIR, index_path=INDEX_PATH):
    docs = _load_documents(data_dir)
    if HAS_EMBED:
        model = SentenceTransformer(model_name)
        texts = [d['text'] for d in docs]
        emb = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
        dim = emb.shape[1]
        index = faiss.IndexFlatIP(dim)
        faiss.normalize_L2(emb)
        index.add(emb)
        # store index and metadata
        np.savez(index_path, emb=emb, ids=[d['id'] for d in docs], titles=[d['title'] for d in docs], urls=[d['url'] for d in docs], texts=texts)
        return True
    else:
        # fallback: save simple corpus JSON
        out = {'docs': docs}
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(out, f, ensure_ascii=False, indent=2)
        return True

def retrieve(query, k=3, model_name='all-MiniLM-L6-v2', index_path=INDEX_PATH):
    docs = _load_documents()
    if HAS_EMBED:
        model = SentenceTransformer(model_name)
        q_emb = model.encode([query], convert_to_numpy=True)
        # load emb
        arr = np.load(index_path, allow_pickle=True)
        emb = arr['emb']
        ids = arr['ids']
        titles = arr['titles']
        urls = arr['urls']
        texts = arr['texts']
        faiss.normalize_L2(q_emb)
        # compute similarities
        sims = (emb @ q_emb.T).squeeze()
        idxs = sims.argsort()[::-1][:k]
        results = []
        for i in idxs:
            results.append({'id': ids[i], 'title': titles[i], 'url': urls[i], 'text': texts[i], 'score': float(sims[i])})
        return results
    else:
        # simple bag-of-words overlap
        q_tokens = set([t.lower() for t in query.split() if len(t) > 2])
        scored = []
        for d in docs:
            tokens = set([t.lower() for t in d['text'].split() if len(t) > 2])
            score = len(q_tokens & tokens)
            scored.append((score, d))
        scored.sort(key=lambda x: x[0], reverse=True)
        results = []
        for s,d in scored[:k]:
            results.append({'id': d['id'], 'title': d['title'], 'url': d['url'], 'text': d['text'], 'score': float(s)})
        return results

if __name__ == '__main__':
    print('Building index from', DATA_DIR)
    build_index()
