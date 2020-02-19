// MT5 Server
// https://github.com/squallooo/MT5
// Developed by a whole lot of people

const fs = require('fs')
const express = require('express')
const path = require('path')

const app = express(),
  http = require('http'),
  server = http.createServer(app)

const PORT = process.env.PORT || 3000,
  TRACKS_PATH = './client/multitrack',
  HOST = process.env.HOST || '0.0.0.0'

app.use(express.static(path.resolve(__dirname, 'client')))

app.get('/tracks', async (req, res) => {
  const trackList = await getTracks()

  if (!trackList) {
    return res.send(404, 'No track found')
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.write(JSON.stringify(trackList))
  res.end()
})

app.get('/tracks/:id', async (req, res) => {
  const id = req.params.id

  let track

  try {
    track = await getTrack(id)
  } catch {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.write(JSON.stringify({ error: 'Track not found with id "' + id + '"' }))
    return res.end()
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.write(JSON.stringify(track))
  res.end()
})

const isASoundFile = fileName => {
  if (fileName.endsWith('.wav')) return true
  if (fileName.endsWith('.mp3')) return true
  if (fileName.endsWith('.ogg')) return true
  if (fileName.endsWith('.m4a')) return true
  return false
}

const getTracks = async () => {
  const directories = await getFiles(TRACKS_PATH)
  return directories.filter(dir => !dir.match(/^\..*/))
}

const getTrack = async id =>
  new Promise(async (resolve, reject) => {
    if (!id) {
      return reject('Need to provide an ID')
    }

    let fileNames

    try {
      filenames = await getFiles(`${TRACKS_PATH}/${id}`)
    } catch {
      return reject(null)
    }

    fileNames.sort()

    resolve({
      id,
      instruments: fileNames
        .filter(fileName => isASoundFile(fileName))
        .map(fileName => ({
          name: fileName.match(/(.*)\.[^.]+$/, '')[1],
          sound: fileName
        }))
    })
  })

const getFiles = async dirName =>
  new Promise((resolve, reject) =>
    fs.readdir(dirName, function (error, directoryObject) {
      if (error) {
        reject(error)
      }

      if (directoryObject !== undefined) {
        directoryObject.sort()
      }
      resolve(directoryObject)
    })
  )

server.listen(PORT, HOST, () => {
  const addr = server.address()
  console.log(`Multi-track server listening at ${addr.address}:${addr.port}`)
})
