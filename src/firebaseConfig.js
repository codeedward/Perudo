import firebase from 'firebase'
import 'firebase/firestore'

// firebase init goes here
var config = {
    apiKey: "AIzaSyBBHEkOumyyWWpZwAURFA4lVKMxMgnnTqU",
    authDomain: "vue-learning-281dc.firebaseapp.com",
    databaseURL: "https://vue-learning-281dc.firebaseio.com",
    projectId: "vue-learning-281dc"
  }
firebase.initializeApp(config)

// firebase utils
const db = firebase.firestore()
const auth = firebase.auth()
const currentUser = auth.currentUser
const self = firebase;

// date issue fix according to firebase
const settings = {
    timestampsInSnapshots: true
}
db.settings(settings)

// firebase collections
const gamesCollection = db.collection('games')
const testCollection = db.collection('test')

export {
    db,
    auth,
    currentUser,
    gamesCollection,
    testCollection,
    self
}