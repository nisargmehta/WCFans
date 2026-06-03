export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })

export const requireEnv = (name: string) => {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export const firstEnv = (...names: string[]) => {
  for (const name of names) {
    const value = Deno.env.get(name)

    if (value) {
      return value
    }
  }

  throw new Error(`Missing required environment variable: ${names.join(' or ')}`)
}
