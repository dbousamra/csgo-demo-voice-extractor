# Usage

```
docker build -t  csgo-demo-voice-extractor .
docker run --rm -it -v ${PWD}:/app csgo-demo-voice-extractor:latest yarn dev demos/1-531fe685-e824-4869-8070-33a1396124ed-1-1.dem output
```