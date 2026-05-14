from retrieval.retriever import build_index

if __name__ == '__main__':
    print('Building retrieval index...')
    ok = build_index()
    if ok:
        print('Index built successfully.')
    else:
        print('Index build failed or used fallback.')
