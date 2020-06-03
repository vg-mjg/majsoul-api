Majsoul API salvaged from https://github.com/SAPikachu/amae-koromo-scripts

Legacy files are remaining unused parts from that project. A lot of it was dedicated to calculating stats and shoving them into a couchDB instance.
Some of it will be useful as it will contain api calls and decoding code. Once I've taken what I need that will go.

yostar.js is the mahjong soul payload that you get from the actual yostar website. Probably not good to have it here but it's a useful resource if you want to really see how things are supposed to work.

src is the actual working part, written in typescript for node.

I prefer yarn

```
yarn
yarn run tsc
node ./dist/results.js
```

You need tokens to run the api. There's an env.js.example, you need to copy that file to the dist directory, rename it to env.js and put in your own information.
The uid and token for majsoul you have to extract from a logged in majsoul instance by looking at the web request it makes to passport.mahjongsoul.com
