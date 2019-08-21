import { fromEvent, of } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  tap,
  catchError,
} from 'rxjs/operators';

import { constants } from '../constants';
import { urlGenerator } from './utilities/urlGenerator';

const input = document.querySelector('input');
const outputUl = document.getElementById('output');


function createLiElement(innerText) {
  const listItem = document.createElement('li');
  listItem.innerText = innerText;
  return listItem;
}

// FUNCTION TO CREATE OUTPUT WITH FOUND GITHUB LOGINS OR MESSAGE WITH NO LOGINS FOUND
function createOutput(data) {
  if (data.items.length === 0) {
    outputUl.innerText = 'There is no github login with provided input data';
  } else {
    data.items.forEach((item) => outputUl.appendChild(createLiElement(item.login)));
  }
}

// OBSERVABLE FOR FETCHING DATA FROM THE SERVER
const fetchedData = (keys) => {
  if (keys) {
    return fromFetch(urlGenerator(keys, constants.TOKEN)).pipe(
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
    switchMap(fetchedData), // fetches needed data from the server
    tap((data) => createOutput(data)),
  )
  .subscribe();
