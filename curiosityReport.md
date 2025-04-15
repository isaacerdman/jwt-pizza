# Jest

Jest is a tool that helps developers make sure their code works the way it’s supposed to. It’s mostly used with JavaScript projects. When you run Jest, it first looks through your project to find files that contain tests—these are usually named something like something.test.js. Once it finds them, it runs each test in its own little bubble so that one test doesn’t accidentally mess up another. It can even run several tests at the same time to save time.

Behind the scenes, Jest has some clever tricks. It can "mock" parts of your code, which means it can fake things like functions or files so you don’t have to use the real ones in every test. This is useful when you want to test something without relying on things like databases or internet connections. Jest also has a feature called snapshot testing, where it saves the expected result of something (like a webpage or component), and then compares future results to that saved version to see if anything changed.

Jest also keeps track of which parts of your code get used during tests—this is called code coverage. It shows you if any parts of your code didn’t get tested, which helps you find gaps. When the tests are all done, Jest shows a report that tells you what passed, what failed, and how much of your code was tested. All of this helps developers catch bugs early and keep their code clean and working well.
