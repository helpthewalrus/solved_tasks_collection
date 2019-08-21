export function urlGenerator(keys, token) {
  return `https://api.github.com/search/users?q=${keys}+in%3Alogin&access_token=${token}&per_page=10`;
}
