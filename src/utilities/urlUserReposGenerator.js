export function urlUserReposGenerator(login) {
  return `https://api.github.com/users/${login}/repos`;
}
