from my_server.gameCards import createRock, createPaper, createScissors

globalPlayerId = 0

class Player:

    def __init__(self, name, account):
        global globalPlayerId
        self.id = globalPlayerId
        self.name = name
        self.activeCard = None
        self.fullInventory = [createRock(owned=True), createPaper(owned=True), createScissors(owned=True)]
        self.inventory = self.fullInventory
        self.discardPile = []
        self.maxHP = 80
        self.HP = 80
        self.account = account
        self.readyNextRound = False
        self.roundWins = 0

        globalPlayerId += 1
    
    def __repr__(self):
        return "Spelare. id: " + (str) (self.id) + "\nNamn: " + self.name + "\nInventory: " + (str)(self.inventory) + "\nHP: " + (str)(self.HP)

    def toDict(self):
        return {
            "id": self.id,
            "name": self.name,
            "activeCard": self.activeCard,
            "fullInventory": self.fullInventory,
            "inventory": self.inventory,
            "discardPile": self.discardPile,
            "maxHP": self.maxHP,
            "HP": self.HP,
            "account": self.account,
            "readyNextRound": self.readyNextRound,
            "roundWins": self.roundWins
        }

globalGameId = 0

class Game:

    def __init__(self):
        global globalGameId
        self.player1 = None
        self.player1Card = None
        self.player2 = None
        self.player2Card = None
        self.gameId = globalGameId
        self.cardRoster = []
        self.round = 1
        self.level = 1
        self.synchronize = 0

        globalGameId += 1
    
    def getGameDeck(self):
        cards = []

        cards.append(createRock())
        cards.append(createPaper())
        cards.append(createScissors())
            
        return cards

    def getPlayer(self, account):

        return Player(account["username"], account).toDict()
    
    def get_game_data(self):
        # samla ihop all nödvändig data från spelet
        # returnera som en dictionary
        pass

    def toDict(self):
        return {
            "player1" : self.player1,
            "player1Card" : self.player1Card,
            "player2" : self.player2,
            "player2Card" : self.player2Card,
            "gameId" : self.gameId,
            "cardRoster" : self.cardRoster,
            "round" : self.round,
            "level" : self.level,
            "synchronize" : self.synchronize
        }



