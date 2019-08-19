import { fromEvent, of } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  tap,
  catchError
} from 'rxjs/operators';

import constants from '../constants';

const input = document.querySelector('input');
const outputUl = document.getElementById('output');


function createLiElement(innerText: any) {
  const listItem = document.createElement('li');
  listItem.innerText = innerText;
  return listItem;
}

// Observable for fetching data from the server
const fetchedData = (keys: any) => {
  if (keys) {
    return fromFetch(`https://api.github.com/search/users?q=${keys}+in%3Alogin&access_token=${constants.TOKEN}&per_page=10`).pipe(
      switchMap(response => {
        if (response.ok) {
          // OK return data
          return response.json();
        } else {
          // Server is returning a status requiring the client to try something else.
          return of({ error: true, message: `Error ${response.status}` });
        }
      }),
      catchError(err => {
        // Network or other error, handle appropriately
        return of({ error: true, message: err.message })
      })
    );
  } else {
    outputUl.innerText = 'Something should be provided for search';
  }
}

// Observable that handles search process
fromEvent(input, 'input')
  .pipe(
    tap(_ => outputUl.innerText = ''), // deletes already found items if user inputs smth again
    map((event: any) => event.target.value),
    debounceTime(500),
    distinctUntilChanged(),
    switchMap(fetchedData), // fetches needed data from the server
    tap((data: any) => {
      if (data.items.length === 0) {
        outputUl.innerText = 'There is no github login with provided input data';
      } else {
        data.items.map((item: any) => {
          outputUl.appendChild(createLiElement(item.login));
        })
      }
    })
  )
  .subscribe();