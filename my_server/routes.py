from datetime import datetime
from flask import render_template, request, flash, url_for,redirect,session,abort
from my_server.gameCards import addRandomCards
from my_server import app, socketio
from flask_socketio import emit, join_room, leave_room, rooms
from my_server.databasehandler import create_connection
from flask_bcrypt import Bcrypt
from my_server.game import Game, Player
import json, time

bcrypt = Bcrypt(app)

#Games that have not started yet, and are possible to join
openGames = {}

#already started games
games = {}
#fetches the current game using the gameId, which is stored with every user
def getGame(gameId):
    gameStr = f'game_{gameId}'
            
    tempGame = games[gameStr]

    return tempGame
def saveGame(gameId, game):
    gameStr = f'game_{gameId}'
            
    games[gameStr] = game

#socket rooms
roomDict = {}

@app.route('/')
@app.route('/mainmenu')
def main_menu():
    if "room" in session:
        session.pop('game', None)
    return render_template('mainmenu.html')

@app.route('/getUserSession')
def getUserSession():
    data = {
        "testValue": "empty",
        "sesUser": "empty",
        "sesGame": "empty"
    }
    if "game" in session:
        data['sesGame'] = session['game']
        session.pop('game', None)
    #if "sesGameNameKey" in session:
    #    data['sesGameNameKey'] = session['sesGameNameKey']
    #if "sesRoom" in session:
    #    data['sesRoom'] = session['sesRoom']
    if "user" in session:
        data['sesUser'] = session['user']
    #if "sesPlayerUser" in session:
    #    data['sesPlayerUser'] = session['sesPlayerUser']
    #if "sesPlayerOpponent" in session:
    #    data['sesPlayerOpponent'] = session['sesPlayerOpponent']

    #if "game" in session:
    #    session.pop('game', None)
    #if "sesGameNameKey" in session:
    #    session.pop('sesGameNameKey', None)
    #if "sesRoom" in session:
    #    session.pop('sesRoom', None)
    #if "sesPlayerUser" in session:
    #    session.pop('sesPlayerUser', None)
    #if "sesPlayerOpponent" in session:
    #    session.pop('sesPlayerOpponent', None)

    return json.dumps(data)

@app.route('/testpage')
def method_name():
    return render_template('testpage.html')

#---------------start game
@app.route('/setPlayerSessions', methods=["POST", "GET"])
def setPlayerSessions():
    roomGame = request.get_json()
    session['game'] = roomGame
    session['gameNameKey'] = f"game_{roomGame['gameId']}"

    if session['game']['player1']['account']['id'] == session['user']['id']:
        session['playerUser'] = "player1"
        session['playerOpponent'] = "player2"
    elif session['game']['player2']['account']['id'] == session['user']['id']:
        session['playerUser'] = "player2"
        session['playerOpponent'] = "player1"

    return json.dumps(session["game"])

@app.route('/renderGame', methods=["POST", "GET"])
def renderGame():

    return render_template('ingame.html')


@app.route('/getGameCode', methods=["POST", "GET"])
def getGameCode():
    userSes = request.get_json()
    newGameInstance = Game().toDict()
    session['user'] = userSes

    if "user" not in session:
        session['user'] = userSes
        
        newGameInstance['player1'] = Player(userSes['username'], userSes).toDict()
    else:
        print(session['user'])
        print(userSes)
        newGameInstance['player1'] = Player(session['user']['username'], session['user']).toDict()

    newGameId = newGameInstance["gameId"]
    
    openGames[f'game_{newGameId}'] = newGameInstance

    return json.dumps(newGameId)

def setPlayerSessions():
    if session['game']['player1']['id'] == session['user']['id']:
        session['playerUser'] = "player1"
        if session['game']['player2']:
            session['playerOpponent'] = "player2"
    else:
        session['playerUser'] = "player2"
        if session['game']['player1']:
            session['playerOpponent'] = "player1"

@app.route('/getGamesList', methods=["POST", "GET"])
def getGamesList():
    gameNameKey = session['gameNameKey']
    sessionGame = session['game']
    data = {
        'games': games,
        'gameNameKey': gameNameKey,
        'sessionGame': sessionGame
    }
    return data

@app.route('/enterGame', methods=["POST"])
def enterGame():

    jsData = request.get_json()
    if jsData['gameId']:
        gameCode = int(jsData['gameId'])

        if loggedIn():
            if request.method == 'POST':
                if f'game_{gameCode}' in openGames:
                    foundGame = openGames[f'game_{gameCode}']
                    
                    # remove game from "openGames" list
                    openGames.pop(f'game_{gameCode}')

                    # Store the game by Id in "games" instead
                    foundGameId = foundGame["gameId"]
                    games[f'game_{foundGameId}'] = foundGame

                    # add user to game
                    foundGame['player2'] = Player(session['user']['username'], session['user']).toDict()

                    # set game as current session game
                    session['game'] = foundGame

                    #setPlayerSessions()

                    return json.dumps(session["game"])

            return json.dumps("Game not found")
        return json.dumps("Not logged in")
    return json.dumps("Game not found")

def loggedIn():
    if 'logged_in' in session and session['logged_in'] == True:
        return True
    return False

def printGame(game):
    print(game)

@app.route('/login', methods = ['POST', 'GET'])
def login():
    if loggedIn():
        return json.dumps("you are already logged in")
    if request.method == 'POST':
        data = request.get_json()
        username = data['username']
        passwd = data['password']
        conn = create_connection()
        cur = conn.cursor()
        sql = 'SELECT * from users WHERE username = ?'
        cur.execute(sql,(username,))
        conn.commit()
        res = cur.fetchone()
        conn.close()
        if bcrypt.check_password_hash(res[2],passwd):
            session['logged_in'] = True
            session['user'] = {'id':res[0],'username':res[1]}
            print(session['user'])
            returnData = {
                "loggedIn": session['logged_in'],
                "user": session['user']
            }
            return json.dumps(returnData)
        flash('Wrong username or password', 'warning')
        return json.dumps("Wrong username")
    return json.dumps("Other error")
    abort(401)

        
@app.route('/account', methods = ['POST', 'GET'])
def account_info():
    return render_template('mainmenu.html')

@app.route('/logout', methods = ['POST', 'GET'])
def logout():
    if loggedIn():
        if request.method == 'GET':
        
            session.clear()
    return json.dumps("Success")

@app.route('/createaccount', methods = ['GET','POST'])
def create_account():
    data = request.get_json()
    username = data['username']
    passwd = data['password1']
    passwd2 = data['password2']
    if passwd == passwd2:
        pw_hash = bcrypt.generate_password_hash(passwd)
        conn = create_connection()
        cur = conn.cursor()
        sql = 'INSERT INTO users (username, password) VALUES (?,?)'
        cur.execute(sql,(username,pw_hash))
        conn.commit()
        conn.close()
        flash('Account successfully created!', 'info')
        return json.dumps("success")
    flash('Lösenorden måste överensstämma','warning')
    return json.dumps("Error")

@app.route('/updateGame', methods=["POST"])
def update_game():
    data = request.get_json()
    game = data['game']
    gameId = data['gameId']
    
    #session["game"] = newGame

    saveGame(gameId, game)

    return json.dumps(getGame(data['gameId']))

@app.route("/getGameData", methods=["GET", "POST"])
def get_game_data():
    data = request.get_json()

    tempGame = getGame(data['gameId'])
    user = data["playerUserNum"]
    opponent = data["playerOpponentNum"]
    newData = {
        'game': tempGame,
        'user': user,
        'opponent': opponent
    }

    return json.dumps(newData)

# POST a played card in the server
@app.route('/playedCard', methods=["POST", "GET"])
def playedCard():
    if request.method == 'POST':
        if "playerUser" in session:
            data = request.get_json()
            tempCard = data['card']
            jsData = data['jsData']
            
            playerCardStr = jsData['playerUserNum'] + "Card"
            tempGame = getGame(jsData['gameId'])
            tempGame[playerCardStr] = tempCard

            returnData = {
                "game": tempGame,
                "bothCardsPlayed": False
            }

            if (tempGame['player1Card'] != None) and (tempGame['player2Card'] != None):
                returnData['bothCardsPlayed'] = True


            return json.dumps(returnData)

    abort(402)

@app.route('/getPickCards', methods=['GET', 'POST'])
def getPickCards():
    jsData = request.get_json()
    tempGame = getGame(jsData['gameId'])
    tempCards = addRandomCards()
    tempList = addRandomCards()
    return json.dumps(tempList)

@app.route('/addCardToInventoryById', methods=['POST'])
def addCardToInventoryById():
    data = request.get_json()
    cardId = data['data']
    jsData = data['jsData']
    numCardId = int(cardId)
    tempGame = getGame(jsData['gameId'])
    tempGame['cardRoster'] = []
    

    for card in jsData['cardRoster']:
        print("")
        print(card['id'])
        print(numCardId)
        print("")
        if numCardId == card['id']:
            print("awoga")
            tempGame[jsData['playerUserNum']]['fullInventory'].append(card)
    return json.dumps(tempGame)




#--------------------------------------------------GAMEPLAY--------------------------------------------------------#

@app.route('/round', methods=["POST"])
def round():
    game = request.get_json()

    gameplayStates = ["Round", "Upgrade", "Conclusion"]
    gameplayState = 0
    roundPhases = ["Planning", "Reveal"]
    roundPhase = 0

    return json.dumps(game)

@app.route('/emptyGameCardSlots', methods=['GET', 'POST'])
def emptyGameCardSlots():
    gameId = request.get_json()
    tempGame = getGame(gameId)
    #session['game']['player1']['discardPile'].append(session['game']['player1Card'])
    tempGame['player1Card'] = None
    #session['game']['player2']['discardPile'].append(session['game']['player2Card'])
    tempGame['player2Card'] = None
    return json.dumps(tempGame)

@app.route('/newRoundPrep', methods=['GET', 'POST'])
def newRound():
    jsData = request.get_json()
    tempGame = getGame(jsData['gameId'])

    # Make sure both players are caught up
    tempGame[jsData['playerUserNum']]['readyNextRound'] = True
    if tempGame[jsData['playerOpponentNum']]['readyNextRound'] == True:

        # reset stored played cards
        tempGame[jsData['playerUserNum']]['readyNextRound'] = False
        tempGame[jsData['playerOpponentNum']]['readyNextRound'] = False
        tempGame['player1Card'] = None
        tempGame['player2Card'] = None

    data = {
        'game': tempGame,
        'user': jsData['playerUserNum'],
        'opponent': jsData['playerOpponentNum']
    }
    return json.dumps(data)

@app.route('/setRoundWinner', methods=['POST'])
def setRoundWinner():
    data = request.get_json()
    playerNum = data['playerNum']
    jsData = data['jsData']
    tempGame = getGame(jsData['gameId'])
    tempGame[playerNum]['roundWins'] += 1
    return json.dumps(tempGame)

@app.route('/synchronizeNextRound', methods=['GET', 'POST'])
def synchronizeNextRound():
    jsData = request.get_json()
    tempGame = getGame(jsData['gameId'])
    tempGame['synchronize'] += 1
    sync = tempGame['synchronize']

    if sync >= 2:
        tempGame['synchronize'] = 0
    
    print(session['user']['username'] + " is adding to sync:\nSync = " + str(sync) + "\nGameSync = " + str(tempGame['synchronize']))
    
    if sync >= 2:
        tempVariant = nextRound(jsData)
        data = {
            'game': tempGame,
            'variant': tempVariant,
            'change': True
        }
        print("----" + session['user']['username'] + " has now synchronized. Round pass!")

    else:
        data = {
            'game': tempGame,
            'variant': "doesn't matter",
            'change': False
        }
        print("----" + session['user']['username'] + " is waiting for synchronize. No round passed...")


    return json.dumps(data)

def newLevel(tempGame):
    tempGame['round'] = 1
    tempGame['level'] += 1

def newRound(tempGame):
    tempGame['round'] += 1

def nextRound(jsData):
    tempGame = getGame(jsData['gameId'])
    if tempGame['round'] >= 3:
        newLevel(tempGame)
        data = "level"
    else:
        newRound(tempGame)
        data = "round"
    return data
    
@app.route('/levelReset', methods=['GET', 'POST'])
def levelReset():
    gameId = request.get_json()
    tempGame = getGame(gameId)
    tempGame['player1']['roundWins'] = 0
    tempGame['player2']['roundWins'] = 0
    return json.dumps(tempGame)
    
@app.route('/checkForGameOver', methods=['POST'])
def checkForGameOver():
    jsData = request.get_json()
    gameId = jsData['gameId']
    tempGame = getGame(gameId)
    if tempGame[jsData['playerUserNum']]['HP'] <= 0:
        return json.dumps("game over")
    return json.dumps(tempGame)

@app.route('/storeCardInWaiting', methods=['POST'])
def storeCardInWaiting():
    data = request.get_json()
    elementHtml = data['element']
    locationId = data['locationId']
    opponentSid = data['opponentSid']
    return json.dumps(True)









#----------------------------------------------- SOCKET STUFF ------------------------------------------------#

# Listen for the 'send_message' event from clients
@socketio.on('check_room')
def check_room(roomName):
    tempRoom = roomName
    userSids = list(socketio.server.manager.rooms.get(request.namespace, {}).get(tempRoom, set()))
    emit('messageFromServer', {
        'message': str(userSids)
    }, to=tempRoom) #to=data['room']

@socketio.on('check_user_sid')
def check_user_sid(room):
    if "user" in session:
        userUsername = str(session['user']['username'])
        emit('sendUserSid', {
            'sid': str(request.sid),
            'name': userUsername
        }, to=room) #to=data['room']

@socketio.on('join')
def onJoin(jsData):
    room = jsData['room']
    userSes = jsData['userSes']
    if "user" not in session:
        session['user'] = userSes
        
    print(userSes)

    joinRoomInDict(room)

    sids = list(socketio.server.manager.rooms.get(request.namespace, {}).get(room, set()))

    send_message_to_room({
        'message': f"User {session['user']['username']} has joined room: {room}.",
        'room': room,
        'users': sids
    })
    if len(sids) >= 2:
        userSid = request.sid
        emit('storePlayerSids', {
            'room': room,
            'sids': sids,
            'userSid': userSid,
            'opponentSid': sids[0]
        }, to=userSid)
        emit('storeOpponentSids', {
            'opponentSid': sids[1]
        }, to=sids[0])
        send_room_to_game({
            'room': room,
            'users': sids
        })
    else:
        userSid = request.sid
        emit('storePlayerSids', {
            'room': room,
            'sids': sids,
            'userSid': userSid,
            'opponentSid': None
        }, to=userSid)

    

@socketio.on('leave')
def onLeave(data):
    roomName = str(data['room'])
    leaveRoomInDict(roomName)
    send_message_to_room({
        'message': f"User {session['user']['username']} has left room: {roomName}.",
        'room': roomName
    })

@socketio.on('send_message_to_room')
def send_message_to_room(data):
    emit('messageFromServer', {
        'message': data['message']
    }, to=data['room']) #to=data['room']

# Start game with both users
@socketio.on('send_room_to_game')
def send_room_to_game(data):
    roomName = str(data['room'])

    tempGame = games[f'game_{data["room"]}']
    emit('redirectToGame', {
        'message': "starting game...",
        'game': tempGame,
    }, to=roomName)

@socketio.on('updateGameSocket')
def updateGameSocket(data):
    game = data['game']
    jsData = data['jsData']
    emit('updateGameInRoom', {
        'game': game
    }, to=jsData['room']) #should be room

def joinRoomInDict(room):
    join_room(room)
    #roomDict[room] = room
    check_room(room)
    check_user_sid(room)

def leaveRoomInDict(room):
    leave_room(room)
    check_room(room)
    check_user_sid(room)

@socketio.on('updateHtmlForOpponent')
def updateHtmlForOpponent(data):

    emit('updateHtmlForOpponent', {
        "element": data['element'],
        "locationId": data['locationId']
    }, room=data['opponentSid'])

def sessionError(sessionValue):
    print("ERROR: no " + sessionValue + " in session")

@socketio.on('socketExecuteRound')
def socketExecuteRound(data):
    gameId = data['gameId']
    game = getGame(gameId)
    emit('socketRecieveExecuteRound', {
        'playerCard1': data['playerCard1'],
        'playerCard2': data['playerCard2'],
        'game': game
    }, to=data['room'])

@socketio.on('choosingCardStage')
def choosingCardStage(data):
    jsData = data['jsData']
    gameId = jsData['gameId']
    tempGame = getGame(gameId)
    
    if int(tempGame[jsData['playerUserNum']]['roundWins']) > int(tempGame[jsData['playerOpponentNum']]['roundWins']):
        emit('waitForOpponentCard', {
            "game": tempGame
        }, room=jsData['opponentSid'])
    else:
        if (len(tempGame[jsData['playerUserNum']]['fullInventory']) < 5): # cap card size at max 5
            emit('chooseCardEmitRecieve', {
                "game": tempGame
            }, room=jsData['userSid'])
        else:
            emit('waitForOpponentCard', {
            "game": tempGame
            }, room=jsData['userSid'])


@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")
    

@socketio.on('goToNextRound')
def goToNextRound(data):
    tempData = data['data']
    room = data['room']
    emit("goToNextRound", tempData, to=room)

@socketio.on('gameOver')
def gameOver(data):
    jsData = data['jsData']
    tempGame = getGame(jsData['gameId'])
    room = jsData['room']
    userSid = jsData['userSid']
    opponentSid = jsData['opponentSid']

    if tempGame[jsData['playerUserNum']]['HP'] <= 0:
        if tempGame[jsData['playerOpponentNum']]['HP'] <= 0:
            emit("conclusionTie", "game over", to=room)
        else:
            emit("conclusionGameOver", "game over", to=userSid) #loss
            emit("conclusionWin", "game over", to=opponentSid) #win
    elif tempGame[jsData['playerOpponentNum']]['HP'] <= 0:
        emit("conclusionWin", "game over", to=userSid) #win
        emit("conclusionGameOver", "game over", to=opponentSid) #loss

    games.pop(f"game_{jsData['gameId']}")

    emit("SetGameOver", "game over", to=room)

@socketio.on('showCards')
def showCards(jsData):
    tempGame = getGame(jsData['gameId'])
    emit("pasteCards", {
        "userCard": tempGame[f'{jsData["playerUserNum"]}Card'],
        "opponentCard": tempGame[f'{jsData["playerOpponentNum"]}Card'],
        "game": tempGame
    }, to=jsData['userSid'])




@socketio.on('runGameFunctions')
def runGameFunctions(data):
    attacker = data['attacker']
    defender = data['defender']
    jsData = data['jsData']

    startTime = time.time()
    endTime = time.time()
    emit('messageFromServer', {
        'message': "testing time 1"
    }, to=data['room']) #to=data['room']
