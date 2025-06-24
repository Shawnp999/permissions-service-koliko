export const logger = {
    info: (data: object) => console.log(JSON.stringify({ level: 'info', ...data })),
    error: (data: object) => console.error(JSON.stringify({ level: 'error', ...data })),
};