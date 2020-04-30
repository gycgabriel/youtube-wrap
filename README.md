Personal YouTube Charts
=======================

Personal YouTube Charts is a Chrome extension that adds a ranking of your most viewed videos to the [watch history page](https://www.youtube.com/feed/history).

This extension is not affiliated in any way with YouTube.


## Installation

Find the extension in the [Chrome web store](https://chrome.google.com/webstore/detail/personal-youtube-charts/beicockjhpniljmibgmmlhdkjjidccea).


## Privacy

Your privacy is important! We recognize that Chrome extensions are powerful and lend themselves to abuse by developers. We make the following promise:

- The extension will only ever requests access to www.youtube.com
- It will never record or store any data from your YouTube account
- It will never modify any data in your YouTube account
- It will never communicate with any server other than www.youtube.com itself


## Caveats

- Each video is counted at most once per day - multiple views per day will count as one.
- If you watch just part of a video on one day it counts as a view (as the video will appear in the watch history). So if you watch a long video, pausing and unpausing over multiple days, this will count as multiple views.
- Any video view that you remove from your watch history will also not appear in the charts


## Development

The `extension` directory is the root for the extension code. For local development, add that directory as an unpacked extension [within Chrome](chrome://extensions/).

The code necessarily depends on undocumented YouTube APIs and UI elements and may prove brittle over time. If you are experiencing problems [file an issue](https://github.com/nikhaldi/youtube-charts/issues) or (notify us)[mailto:nhaldimann@gmail.com].


## License

The code is released under the MIT license included in this repository.
