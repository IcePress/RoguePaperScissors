import random

globalCardId = 0

class Card():
    def __init__(self, imgId, name, cardClass, maxDEF, maxATK, desc, func=None, owned=False):
        global globalCardId
        self.id = globalCardId
        self.imgId = imgId
        self.name = name
        self.cardClass = cardClass
        self.maxDEF = maxDEF
        self.DEF = maxDEF
        self.maxATK = maxATK
        self.ATK = maxATK
        self.desc = desc
        self.func = func
        self.owned = owned

        globalCardId += 1
    
    def __repr__(self):
        return f"Card({self.name}, class: {self.cardClass}, ATK: {self.ATK}, DEF: {self.DEF})"

    def toDict(self):
        return {
            "id": self.id,
            "imgId": self.imgId,
            "name": self.name,
            "cardClass": self.cardClass,
            "maxDEF": self.maxDEF,
            "DEF": self.DEF,
            "maxATK": self.maxATK,
            "ATK": self.ATK,
            "desc": self.desc,
            "func": self.func,
            "owned": self.owned
        }

def addRandomCards():
    #return [createRock(owned=False), createRock(owned=False), createScissors(owned=False)]
    cardList = []
    fullCardRoster = [
        #common cards
        createRock(owned=False),        createRock(owned=False),        createRock(owned=False),        createRock(owned=False),
        
        createPaper(owned=False),       createPaper(owned=False),       createPaper(owned=False),       createPaper(owned=False),
        
        createScissors(owned=False),    createScissors(owned=False),    createScissors(owned=False),    createScissors(owned=False),

        #uncommon cards
        createDwayneRock(owned=False),      createDwayneRock(owned=False),
        createMusicRock(owned=False),       createMusicRock(owned=False),

        createUno2Paper(owned=False),       createUno2Paper(owned=False),
        createParkingPaper(owned=False),    createParkingPaper(owned=False),

        createEdwardScissors(owned=False),  createEdwardScissors(owned=False),
        createBarberScissors(owned=False),  createBarberScissors(owned=False),

        #rare cards
        createMeteorRock(owned=False),
        createLandmineRock(owned=False),

        createPeacePaper(owned=False),
        createUno4Paper(owned=False),

        createChainsawScissors(owned=False),
        createGuillotineScissors(owned=False)
    ]
    
    randomCard1 = random.choice(fullCardRoster) #https://www.geeksforgeeks.org/python-select-random-value-from-a-list/
    randomCard2 = random.choice(fullCardRoster)
    randomCard3 = random.choice(fullCardRoster)

    cardList.append(randomCard1)
    cardList.append(randomCard2)
    cardList.append(randomCard3)
    
    return cardList

#---------------ROCKS
def createRock(owned = False):
    return Card(
        imgId="static/images/rockIcon.PNG",
        name="Rock",
        cardClass="rock",
        maxDEF=18,
        maxATK=22,
        desc="A small Rock",
        owned=owned
    ).toDict()

def createDwayneRock(owned = False):
    return Card(
        imgId="static/images/dwayneIcon.PNG",
        name="Dwayne",
        cardClass="rock",
        maxDEF=28,
        maxATK=24,
        desc="Crushing performance",
        owned=owned
    ).toDict()

def createMusicRock(owned = False):
    return Card(
        imgId="static/images/rockBand.jpg",
        name="Rock Band",
        cardClass="rock",
        maxDEF=26,
        maxATK=27,
        desc="Unreleased LP",
        owned=owned
    ).toDict()

def createMeteorRock(owned = False):
    return Card(
        imgId="static/images/meteorIcon.PNG",
        name="Meteor",
        cardClass="rock",
        maxDEF=31,
        maxATK=50,
        desc="Hagsätra",
        owned=owned
    ).toDict()

def createLandmineRock(owned = False):
    return Card(
        imgId="static/images/rockIcon.PNG",
        name="Landmine",
        cardClass="rock",
        maxDEF=90,
        maxATK=14,
        desc="Suspicious looking rock",
        owned=owned
    ).toDict()

#---------------PAPERS
def createPaper(owned = False):
    return Card(
        imgId="static/images/paperIcon.PNG",
        name="Paper",
        cardClass="paper",
        maxDEF=15,
        maxATK=25,
        desc="A white piece of paper",
        owned=owned
    ).toDict()

def createUno2Paper(owned = False):
    return Card(
        imgId="static/images/uno2Icon.PNG",
        name="Uno +2",
        cardClass="paper",
        maxDEF=24,
        maxATK=28,
        desc="Call it karma",
        owned=owned
    ).toDict()

def createParkingPaper(owned = False):
    return Card(
        imgId="static/images/parkingTicketIcon.PNG",
        name="P-Ticket",
        cardClass="paper",
        maxDEF=21,
        maxATK=30,
        desc="Slip up",
        owned=owned
    ).toDict()

def createPeacePaper(owned = False):
    return Card(
        imgId="static/images/peaceIcon.PNG",
        name="Treaty",
        cardClass="paper",
        maxDEF=40,
        maxATK=40,
        desc="Change ~ Revolution",
        owned=owned
    ).toDict()

def createUno4Paper(owned = False):
    return Card(
        imgId="static/images/uno4Icon.PNG",
        name="Uno +4",
        cardClass="paper",
        maxDEF=30,
        maxATK=50,
        desc="Read and weep",
        owned=owned
    ).toDict()

#---------------SCISSORS
def createScissors(owned = False):
    return Card(
        imgId="static/images/scissorsIcon.PNG",
        name="Scissors",
        cardClass="scissors",
        maxDEF=15,
        maxATK=25,
        desc="A pair of Scissors",
        owned=owned
    ).toDict()

def createEdwardScissors(owned = False):
    return Card(
        imgId="static/images/edward.png",
        name="Edward",
        cardClass="scissors",
        maxDEF=20,
        maxATK=31,
        desc="That one bro from the movie",
        owned=owned
    ).toDict()

def createBarberScissors(owned = False):
    return Card(
        imgId="static/images/barberIcon.PNG",
        name="Barber",
        cardClass="scissors",
        maxDEF=25,
        maxATK=29,
        desc="Fresh Force",
        owned=owned
    ).toDict()

def createGuillotineScissors(owned = False):
    return Card(
        imgId="static/images/guillotineIcon.PNG",
        name="Guillotine",
        cardClass="scissors",
        maxDEF=5,
        maxATK=75,
        desc="Icebreaker",
        owned=owned
    ).toDict()

def createChainsawScissors(owned = False):
    return Card(
        imgId="static/images/chainsawIcon.PNG",
        name="Chainsaw",
        cardClass="scissors",
        maxDEF=31,
        maxATK=51,
        desc="Breakcore fanfiction",
        owned=owned
    ).toDict()

