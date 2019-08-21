export function urlUserGenerator(keys) {
  return `https://api.github.com/search/users?q=${keys}+in%3Alogin&per_page=10`;
}
