import { fromEvent, of, zip } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  concatMap,
  tap,
  catchError,
  filter,
} from 'rxjs/operators';

import { constants } from '../constants';
import { urlUserGenerator } from './utilities/urlUserGenerator';
import { urlUserReposGenerator } from './utilities/urlUserReposGenerator';

const input = document.querySelector('input');
const outputTable = document.getElementById('output');


/*--------------------------
-------DOM FUNCTIONS--------
---------------------------*/

// FUNCTION TO CREATE LI ELEMENT WITH LOGIN AND NUMBER OF REPOS
// eslint-disable-next-line no-unused-vars
function createLiElement(login, repos) {
  const listItem = document.createElement('li');
  listItem.innerText = `login: ${login}, repos: ${repos}`;
  return listItem;
}

function createRow(login, repos, rowType) {
  const row = document.createElement('tr');
  const loginCell = document.createElement(rowType);
  loginCell.innerText = login;
  const reposCell = document.createElement(rowType);
  reposCell.innerText = repos;
  row.append(loginCell, reposCell);
  return row;
}


// FUNCTION TO CREATE OUTPUT WITH FOUND GITHUB LOGINS OR MESSAGE WITH NO LOGINS FOUND
function createOutput(data) {
  if (data.length === 0) {
    outputTable.innerText = 'There is no github login with provided input data';
  } else {
    outputTable.appendChild(createRow('Login', 'Repos', 'th'));
    data.forEach((item) => outputTable.appendChild(createRow(item.login, item.repos, 'td')));
  }
}


/*------------------------------------
-------SUPPORT FUNCTIONS--------
------------------------------------*/

function filterUsers(users) {
  if (users.items.length === 0) {
    createOutput(users.items);
  }
  return users;
}


// CREATE OBJECT WITH FOUND DATA
function createDataObject(users, repos) {
  return users.items.map((item, index) => ({ login: item.login, repos: repos[index].length }));
}


/*------------------------------------
-------FETCHING INFO FUNCTIONS--------
------------------------------------*/

// FUNCTION FOR FETCHING REPOS BY LOGIN
const fetchRepos = (login) => fromFetch(urlUserReposGenerator(login), {
  method: 'GET',
  headers: new Headers({ Authorization: constants.TOKEN }),
}).pipe(
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


// FUNCTION FOR LOADING ALL FOUND USERS' REPOS
const parseFetchedRepos = (users) => {
  const result = zip(
    ...users.map((user) => fetchRepos(user.login)),
  );
  return result;
};


// FUNCTION FOR FETCHING USERS' LOGINS FROM THE SERVER
const fetchedData = (keys) => {
  if (keys) {
    return fromFetch(urlUserGenerator(keys), {
      method: 'GET',
      headers: new Headers({ Authorization: constants.TOKEN }),
    }).pipe(
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
  outputTable.innerText = 'Something should be provided for search';
  return outputTable;
};


/*--------------------------------------
-------OBSERVABLE FOR MAIN LOGIC--------
--------------------------------------*/

// OBSERVABLE THAT HANDLES SEARCH PROCESS
fromEvent(input, 'input')
  .pipe(
    tap(() => outputTable.innerText = ''),
    map((event) => event.target.value),
    debounceTime(500),
    distinctUntilChanged(),
    switchMap(fetchedData),
    filter((users) => filterUsers(users)),
    concatMap((fetchedUserData) => parseFetchedRepos(fetchedUserData.items),
      (users, repos) => createDataObject(users, repos)),
    tap((data) => createOutput(data)),
  )
  .subscribe();
