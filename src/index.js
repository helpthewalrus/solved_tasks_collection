import { fromEvent, of, zip /* from */ } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  // mergeMap,
  tap,
  catchError,
} from 'rxjs/operators';

import { constants } from '../constants';
import { urlUserGenerator } from './utilities/urlUserGenerator';
import { urlUserReposGenerator } from './utilities/urlUserReposGenerator';

const input = document.querySelector('input');
const outputUl = document.getElementById('output');


// function createLiElement(innerText) {
//   const listItem = document.createElement('li');
//   listItem.innerText = innerText;
//   return listItem;
// }

const fetchRepos = (login) => fromFetch(urlUserReposGenerator(login)).pipe(
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

// eslint-disable-next-line no-unused-vars
const fetchedRepos = (users) => {
  // const arrOfRepoObservables = users.map((user) => fetchRepos(user.login));
  zip(
    ...users.map((user) => fetchRepos(user.login)),
  ).subscribe();
  // return result;
};

// FUNCTION TO CREATE OUTPUT WITH FOUND GITHUB LOGINS OR MESSAGE WITH NO LOGINS FOUND
// function createOutput(data) {
//   if (data.items.length === 0) {
//     outputUl.innerText = 'There is no github login with provided input data';
//   } else {
//     data.items.forEach((item) => {
//       // eslint-disable-next-line no-console
//       // console.log(fetchedRepos(item.login));
//       return outputUl.appendChild(createLiElement(item.login));
//     });
//   }
// }

// OBSERVABLE FOR FETCHING DATA FROM THE SERVER
const fetchedData = (keys) => {
  if (keys) {
    return fromFetch(urlUserGenerator(keys, constants.TOKEN)).pipe(
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
    tap(() => {
      outputUl.innerText = '';
      return outputUl;
    }), // DELETES ALREADY FOUND ITEMS IF USER INPUTS SMTH AGAIN
    map((event) => event.target.value),
    debounceTime(500),
    distinctUntilChanged(),
    switchMap(fetchedData),
    tap((fetchedUserData) => fetchedRepos(fetchedUserData.items)),
    // map((data) => console.log(data)),
    // tap((data) => createOutput(data)),
  )
  .subscribe();
