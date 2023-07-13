export function extractFileName(file) {
    const regex = /\/([^/]+)\/?$|([^/]+)$/
    const match = file.match(regex);

    if (match && match.length > 0) {
        return match[0].replace('/', '');
    }

    return null;
}