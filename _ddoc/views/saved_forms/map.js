function map(doc) {
    if (doc.type === 'form') {
        emit(doc._id, doc.name);
    }
}