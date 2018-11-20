import Vue from 'vue'
import Vuex from 'vuex'
const fb = require('./firebaseConfig.js')

Vue.use(Vuex)

export const store = new Vuex.Store({
    state: {
        currentUser: null,
        availableGames: null
    },
    getters: {
        getGame: (state) => (gameId) => {
            var foundGame = state.availableGames.find((el)=> { 
                return el.id == gameId
            });
            return foundGame;
        },
        rollTheDices: () => (dicesNum) => {
            var result = [];
            for(var i=0; i<dicesNum; i++){
                var randomDice = Math.floor(6*Math.random())+1;
                result.push(randomDice);
            }
            return result;
        },
        availableToJoinGames: state => {
            var result = null;
            if(state.availableGames)
            {
                result = state.availableGames.filter(game => game.status == 1 && game.players.find(el => {return el.id == state.currentUser.uid}) == null);
            }
            return result;
        },
        userGames: state => {
            var result = null;
            if(state.availableGames && state.currentUser)
            {
                result = state.availableGames.filter(
                    game => game.players.find(el => {return el.id == state.currentUser.uid}) != null && game.status < 3
                );
            }
            return result;
        }
    },
    actions: {
        setCurrentUser({ commit }, data) {
            commit('setCurrentUserMutation', data.user);
        },
        fetchAvailableGames({ commit }) {
            console.log('fetchAvailableGames');
            fb.gamesCollection.where('status','<=', 3).onSnapshot(gamesSnapshot => {
                let gamesArray = [];

                gamesSnapshot.forEach(doc=>{
                    let game = doc.data();
                    game.id = doc.id;
                    game.players = [];
                    fb.gamesCollection.doc(game.id).collection('players').orderBy('playerNum').onSnapshot(playersSnapshot => {
                        var playersArray = [];
                        playersSnapshot.forEach(playerDoc=> {                            
                            let player = playerDoc.data();
                            player.id = playerDoc.id;
                            playersArray.push(player);
                        });
                        game.players = playersArray;
                    });
                    gamesArray.push(game);
                })

                commit('setAvailableGames', gamesArray);
            });
        },
        createNewGame({ dispatch }){
            return new Promise((resolve, reject) => {
                fb.gamesCollection.add({
                    name: 'Game' + Date.now(),
                    createdOn: Date.now(),
                    status: 1,
                    maxDices: 5,
                    activePlayerNum: 1,
                    createdByUid: this.state.currentUser.uid,
                    isStartOfNewRound: true,
                    finishedRoundUserId: null,
                    finishedRoundReasonText: ""
                }).then((data)=>{
                    var gameId = data.id;
                    dispatch('addPlayerIntoGame', {gameId: gameId})
                    .then(()=>{
                        resolve({gameId});
                    });  
                })
                .catch(err => {
                    reject();
                    console.log(err)
                })
            });
        },
        leaveTheGame({store}, data){
            var gameId = data.gameId;
            var userUid = this.state.currentUser.uid;
            var createdBy = data.createdByUid;
            fb.gamesCollection.doc(gameId).collection('players').doc(userUid).delete();
            if(userUid == createdBy) {
                fb.gamesCollection.doc(gameId).delete();
            }
        },
        joinTheGame({store, dispatch}, data){
            var gamePlayerRef = fb.gamesCollection.doc(data.gameId).collection('players').doc(this.state.currentUser.uid);
            gamePlayerRef.get().then(function(doc){
                if(!doc.exists){
                    dispatch('addPlayerIntoGame', {gameId: data.gameId});  
                }
            });
        },
        addPlayerIntoGame({store}, data){
            var gameId = data.gameId;
            var currentUser = this.state.currentUser;
            var playerNum = 0;
            var numOfDices = this.getters.getGame(gameId).maxDices;

            var gamePlayerRef = fb.gamesCollection.doc(gameId).collection('players').doc(currentUser.uid);
            return gamePlayerRef.set({
                email: currentUser.email,
                playerNum: playerNum,
                numOfDices: numOfDices,
                currentRoll: [],
                betType: "",
                betNumber: 0,
                betQuantity: 0
            })
        },
        changeGameStatus({}, data){
            var gameId = data.gameId;
            var status = data.status;
            var gameRef = fb.gamesCollection.doc(gameId);
            gameRef.update({status});
        },
        startGame({dispatch}, data){
            dispatch('changeGameStatus', data)
            .then((requestData)=>{
                dispatch('setUsersNumbers', data)
                .then(()=>{
                    dispatch('setUsersRolledDices', data);
                });
            })
        },
        setUsersNumbers({}, data){
            var gameId = data.gameId;
            var players = this.getters.getGame(gameId).players;
            var batch = fb.db.batch();

            players.sort(function() { return 0.5 - Math.random() });
            for(var i=0; i < players.length; i++){
                var playerRf = fb.gamesCollection.doc(gameId).collection('players').doc(players[i].id);
                batch.update(playerRf, {"playerNum": i+1});
            }
            batch.commit();
        },
        setUsersRolledDices({}, data){
            var gameId = data.gameId;
            var players = this.getters.getGame(gameId).players;
            var batch = fb.db.batch();

            for(var i=0; i < players.length; i++){
                var playerRf = fb.gamesCollection.doc(gameId).collection('players').doc(players[i].id);
                let currentRoll = this.getters.rollTheDices(players[i].numOfDices);
                batch.update(playerRf, {"currentRoll": currentRoll});
            }
            batch.commit();
        },
        setPlayerBet({}, data){
            var gameId = data.gameId;
            var currentUser = this.state.currentUser;
            var betType = data.betType;
            var betNumber = data.betNumber;
            var betQuantity = data.betQuantity;
            var playerRef = fb.gamesCollection.doc(gameId).collection("players").doc(currentUser.uid);
            return playerRef.update({betType, betNumber, betQuantity}).then(()=>{
                fb.gamesCollection.doc(gameId).update(
                    {
                        isStartOfNewRound: false,
                        finishedRoundUserId: null,
                        finishedRoundReasonText: ""
                    });
            });
        },
        setActivePlayer({}, data){
            var gameId = data.gameId;
            var activePlayerNum = data.activePlayerNum;
            var gameRef = fb.gamesCollection.doc(gameId);
            return gameRef.update({activePlayerNum});
        },
        finishRound({}, data){
            var gameId = data.gameId;
            var playerToChangeLivesId = data.playerToChangeLivesId;
            var livesChange = data.livesChange;
            var nextRoundActivePlayerNum = data.nextRoundActivePlayerNum;
            var finishedRoundReasonText = data.finishedRoundReasonText;

            var players = this.getters.getGame(gameId).players;
            var batch = fb.db.batch();

            for(var i=0; i < players.length; i++){
                var playerRf = fb.gamesCollection.doc(gameId).collection('players').doc(players[i].id);
                var playerItem = players[i];
                let currentRoll = this.getters.rollTheDices(playerItem.numOfDices);
                var currentUser = this.state.currentUser;

                if(playerItem.id == playerToChangeLivesId){
                    var newLivesCount = playerItem.numOfDices + livesChange;
                    currentRoll = this.getters.rollTheDices(newLivesCount);
                    batch.update(playerRf, {"numOfDices" : newLivesCount});
                }
                batch.update(playerRf, 
                {
                    "betType": '',
                    'betNumber': 0, 
                    'betQuantity': 0, 
                    "currentRoll": currentRoll
                });
            }

            fb.gamesCollection.doc(gameId).update(
                {
                    "activePlayerNum" : nextRoundActivePlayerNum, 
                    "isStartOfNewRound": true,
                    "finishedRoundReasonText": finishedRoundReasonText,
                    "finishedRoundUserId": currentUser.uid
                }
            );
            batch.commit();
        },
    }, 
    mutations: {
        setCurrentUserMutation(state, val) {
            state.currentUser = val;
        },
        setAvailableGames(state, val) {
            if(val){
                state.availableGames = val;
            }
            else {
                state.availableGames = [];
            }
        }
    }
})