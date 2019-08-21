import { fromEvent, of, zip } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  mergeMap,
  tap,
  catchError,
} from 'rxjs/operators';

import { constants } from '../constants';
import { urlUserGenerator } from './utilities/urlUserGenerator';
import { urlUserReposGenerator } from './utilities/urlUserReposGenerator';

const input = document.querySelector('input');
const outputUl = document.getElementById('output');


function createLiElement(login, repos) {
  const listItem = document.createElement('li');
  listItem.innerText = `login: ${login}, repos: ${repos}`;
  return listItem;
}

const fetchRepos = (login) => {
  return fromFetch(urlUserReposGenerator(login), {method: "GET", headers: new Headers({
    'Authorization': constants.TOKEN})}).pipe(
      switchMap((response) => {
    if (response.ok) {
      // OK RETURN DATA
      return response.json();
    }
    // SERVER IS RETURNING A STATUS REQUIRING THE CLIENT TO TRY SOMETHING ELSE
    return of({ error: true, message: `Error ${response.status}` });
  }),
  // NETWORK OR OTHER ERROR, HANDLE APPROPRIATELY
  catchError((err) => of({ error: true, message: err.message })),
)};

const parseFetchedRepos = (users) => {
  const result = zip(
    ...users.map((user) => fetchRepos(user.login)),
  );
  result.subscribe();
  return result;
};

// FUNCTION TO CREATE OUTPUT WITH FOUND GITHUB LOGINS OR MESSAGE WITH NO LOGINS FOUND
function createOutput(data) {
  if (data.length === 0) {
    outputUl.innerText = 'There is no github login with provided input data';
  } else {
    data.forEach((item) => {
      return outputUl.appendChild(createLiElement(item.login, item.repos));
    });
  }
}

// OBSERVABLE FOR FETCHING DATA FROM THE SERVER
const fetchedData = (keys) => {
  if (keys) {
    return fromFetch(urlUserGenerator(keys), {method: "GET", headers: new Headers({
      'Authorization': constants.TOKEN})}).pipe(
      switchMap((response) => {
        if (response.ok) {
          // OK RETURN DATA
          return response.json();
        }
        // SERVER IS RETURNING A STATUS REQUIRING THE CLIENT TO TRY SOMETHING ELSE
        return of({ error: true, message: `Error ${response.status}` });
      }),
      // NETWORK OR OTHER ERROR, HANDLE APPROPRIATELY
      catchError((err) => of({ error: true, message: err.message })),
    );
  }
  outputUl.innerText = 'Something should be provided for search';
  return outputUl;
};

// OBSERVABLE THAT HANDLES SEARCH PROCESS
fromEvent(input, 'input')
  .pipe(
    tap(() => { // DELETES ALREADY FOUND ITEMS IF USER INPUTS SMTH AGAIN
      outputUl.innerText = '';
      return outputUl;
    }),
    map((event) => event.target.value),
    debounceTime(500),
    distinctUntilChanged(),
    switchMap(fetchedData),
    mergeMap((fetchedUserData) => parseFetchedRepos(fetchedUserData.items), (users, repos) => {
      const resultArr = users.items.map(item => {
        return {'login': item.login, 'repos': repos.shift().length};
      })
      return resultArr;
    }),
    tap((data) => createOutput(data)),
  )
  .subscribe();
