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
        // generatePlayerGameNumber: (state) => (gameId) => {
        //     var currentGame = state.availableGames.find((el)=> { 
        //         return el.id == gameId
        //     });

        //     var generatedNumber = 1;
        //     while(true)
        //     {
        //         var numberExists = currentGame.players.find(x => x.playerNum == generatedNumber) != null;
        //         if(!numberExists) {
        //             break;
        //         }
        //         ++generatedNumber;
        //     }
        //     return generatedNumber;
        // }
        getGame: (state) => (gameId) => {
            var foundGame = state.availableGames.find((el)=> { 
                return el.id == gameId
            });
            return foundGame;
        }
    },
    actions: {
        setCurrentUser({ commit }, data) {
            commit('setCurrentUserMutation', data.user);
        },
        fetchAvailableGames({ commit }) {
            console.log('fetchAvailableGames');
            fb.gamesCollection.where('status','<=', 2).onSnapshot(gamesSnapshot => {
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
                            console.log('read player:' + player.email)
                        });
                        game.players = playersArray;
                    });
                    gamesArray.push(game);
                })

                commit('setAvailableGames', gamesArray);
            });
        },
        createNewGame({ store }){
            console.log('create new game');
            fb.gamesCollection.add({
                name: 'Game' + Date.now(),
                createdOn: new Date(),
                status: 1,
                maxDices: 6,
                activePlayer: 1,
                activeBet: '',
                createdByUid: this.state.currentUser.uid//,  
                //players: [this.state.currentUser.uid] 
            }).then((data)=>{
                // var gamePLayerRef = fb.gamesCollection.doc(data.gameId).collection('players').doc(this.state.currentUser.uid);
                // dispatch('addPlayerIntoGame', {gamePLayerRef: gamePLayerRef});  
            })
            .catch(err => {
                console.log(err)
            })
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
            console.log('addPlayerIntoGame');
            var gameId = data.gameId;
            var currentUser = this.state.currentUser;
            var playerNum = 0;//this.getters.generatePlayerGameNumber(gameId);
            var numOfDices = 6;

            var gamePlayerRef = fb.gamesCollection.doc(gameId).collection('players').doc(currentUser.uid);
            gamePlayerRef.set({
                email: currentUser.email,
                playerNum: playerNum,
                numOfDices: numOfDices,
                currentRoll: []
            })
        },
        fetchGame({store}, data) {
            fb.gamesCollection.doc(data.gameId).onSnapshot(querySnapshot => {
                var result = null;
                if(querySnapshot.exists){
                    result = querySnapshot.data();
                }
                return result;
            });
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
                dispatch('setUsersNumbers', data);
            });  
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
        }
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