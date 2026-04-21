export async function sendMessage(
  phone: string,
  message: string,
  instanceId: string,
  token: string,
): Promise<boolean> {
  try {
    const url = `https://api.ultramsg.com/${encodeURIComponent(instanceId)}/messages/chat`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        to: phone,
        body: message,
      }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}
