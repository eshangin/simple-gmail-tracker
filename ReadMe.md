![An example of the tracker's operation](assets/simple-Gmail-tracker-example.png)

# Simple Gmail Tracker

The complete source code of email tracker for Gmail, including the extension and server. You can quickly launch and test it, then create your own tracker that meets your needs.

## Installing

```shell
cd server
npm install
cd ../extension
npm install
cd ../dev-launcher
npm install
```

Now create file `env.local.json` (see env.local.json.example) and put your token and optionally domain name from your [ngrok](https://ngrok.com/) account.

Configuration is ready. Run in `dev-launcher` folder:
```shell
npm run dev
```

## License

This project is released under the MIT License. See the LICENSE.txt file for details.