export function generateUUID(): string {
  // UUID v4 생성 (랜덤 기반)
  // 예: '550e8400-e29b-41d4-a716-446655440000'
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
