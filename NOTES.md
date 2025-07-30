# Notes and observation

1. uses older style of class creation proto chain
2. Code looks to only be made to only run in the browser - given XMLHttpRequest and alert are browser only modules
3. No tests so likely some that will need implementing before begin any refactoring
4. missing `GetBookListApiClient` in BookSearchApiClient. I don't believe that this code will actually fun given the method is missing
5. api.book-seller-example.com is not a real api so will have to mock/stub this out to ensure the code is runable

# Approach

1. Attempt to get the code running (after checking for any bad actor code)
2. Write some basic tests to ensure input outs are stable
3. Refactor to use more modern tooling and synatx - ensuring tests pass after each major step
