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

const TOKEN = '18b48cb8901c982a0617a5a3707a1a4e8ad70e2e';
const input = document.querySelector('input');



// Observable for fetching data from the server
const fetchedData = (keys: any) => {
  if (keys) {
    return fromFetch(`https://api.github.com/search/users?q=${keys}+in%3Alogin&access_token=${TOKEN}&per_page=10`).pipe(
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
    document.getElementById('output').innerText = 'Something should be provided for search';
  }
}


// Observable that handles search process
fromEvent(input, 'input')
  .pipe(
    tap(_ => document.getElementById('output').innerText = ''), // deletes already found items if user inputs smth again
    map((event: any) => event.target.value),
    debounceTime(500),
    distinctUntilChanged(),
    switchMap(fetchedData), // fetches needed data from the server
    tap((data: any) => {
      if (data.items.length === 0) {
        document.getElementById('output').innerText = 'There is no github login with provided input data';
      } else {
        data.items.map((item: any) => {
          document.getElementById('output').innerText += (item.login + '\n');
        })
      }
    })
  )
  .subscribe();