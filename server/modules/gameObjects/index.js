class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
    }
}

//TODO: enable card shuffling on init()!! - it was disabled for development
class Deck {
    // clubs, diamonds, hearts, spades
    // this is the rank of the suits in belote
    validSuits = ['C', 'D', 'H', 'S']
    validRanks = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A']

    constructor() {
        this.cards = []
    }

    initDeck() {
        for (const suit of this.validSuits)
            for (const rank of this.validRanks)
                this.cards.push(new Card(suit, rank))
        // this.shuffle()
    }
    // ^^ enable card shuffle ^^

    addCardToTop(card) {
        const suit = card.suit
        const rank = card.rank
        //check if card is valid and not already in deck
        if ((this.validSuits.includes(suit) && this.validRanks.includes(rank))) {
            let inDeck = false
            for (const presentCard of this.cards) {
                if ((presentCard.rank == rank) && (presentCard.suit == suit)) {
                    inDeck = true
                }
            }
            if (!inDeck) {
                this.cards.push(card)
            }
        }
    }

    addCardsToTop(cards) {
        //this for might actually should to be in reverse order?
        for (const card of cards)
            this.addCardToTop(card)
    }

    shuffle() {
        const array = this.cards;
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        this.cards = array;
    }

    split(pos) {
        let part = this.cards.splice(0, pos);
        this.cards = this.cards.concat(part);
    }

    grabCardsFromTop(numOfCards) {
        return this.cards.splice(this.cards.length - numOfCards, this.cards.length)
    }
}

class Team {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }

    isReady() {
        try {
            if (this.p1 && this.p2)
                return true
            else
                return false
        } catch {
            return false;
        }
    }
}

class Hand {
    constructor(playerName) {
        this.cards = []
        this.playerName = playerName
    }

    addCards(arrayOfCards) {
        for (const card of arrayOfCards) {
            this.cards.push(card)
        }
    }

    placeCard(cardIndex) {
        let card = this.cards.splice(cardIndex, 1)

        card = card[0]
        card.placedBy = this.playerName
        return card;
    }

    grabCardsFromTop(numOfCards) {
        return this.cards.splice(this.cards.length - numOfCards, this.cards.length)
    }
}

class Premium {
    constructor(belongsTo, premiumType, roundTrump, cards) {
        this.belongsTo = belongsTo;
        this.premiumType = premiumType;
        this.roundTrump = roundTrump;
        this.cards = cards;

        if (premiumType == 'B') {
            this.valid = this.checkValidBelote();
        } else {
            this.valid = false;  // Prime non valide pour d'autres types
        }

        this.points = this.calculatePoints();
    }


    calculatePoints() {
        if (!this.valid) return 0;
        if (this.premiumType == 'B') return 20;
        return 0;  // Aucun point pour d'autres types
    }

    checkValidBelote() {
        // check if it's only two cards
        if (this.cards.length != 2) return false;
        // check if suits of two cards match
        if (this.cards[0].suit != this.cards[1].suit) return false;
        // check if cards are Q and K
        if (!(this.cards[0].rank == 'Q' && this.cards[1].rank == 'K')) return false;
        // check round trump
        if (this.roundTrump != 'A')
            if (this.roundTrump != this.cards[0].suit)
                return false;

        return true;
    }

}

class Round {
    status_options = ['waiting_for_split', 'started_selecting_suit', 'suit_selected', 'in_progress', 'over']
    //clubs, diamonds, hearts, spades, no, all
    //passes are handled separetly, with a 'P'
    suit_ranks = ['C', 'D', 'H', 'S', 'N', 'A']
    trump_card_order = ['7', '8', 'Q', 'K', '10', 'A', '9', 'J']
    no_trump_card_order = ['7', '8', '9', 'J', 'Q', 'K', '10', 'A']
    premium_card_order = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A']

    constructor(mainDeck, t1, t2, roundNum) {
        //for t1 and t2
        this.teamPiles = [new Deck(), new Deck()]

        this.players = []
        this.players.push(t1.p1)
        this.players.push(t1.p2)
        this.players.push(t2.p1)
        this.players.push(t2.p2)

        this.mainDeck = mainDeck;
        this.roundNum = roundNum;
        this.playerTurn = roundNum % 4;

        //indexes for players and hands are the same, so players[0]'s hand is hands[0]
        this.hands = []
        for (const player of this.players)
            this.hands.push(new Hand(player))

        //vars used when calling the suit
        this.consecutivePasses = 0;
        this.suit = null;
        this.modifier = 1;
        this.caller = null;
        this.callerTeam = null;
        this.status = this.status_options[0];

        //vars used when playing the actuall game
        this.cardsOnTable = new Deck()
        this.premiums = []

        // end of game vars
        this.valid_premiums = []
        this.teamCardScores = [0, 0]
        this.teamPremiumScores = [0, 0]
        this.teamNumberOfHands = [0, 0]

        //game progress vars
        this.playedCardHistory = []
    }

    splitDeck(playername, splitPos) {
        if (playername != this.players[this.playerTurn]) {
            return false
        }
        else {
            if (splitPos > 0 && splitPos < 32) {
                this.mainDeck.split(splitPos);
                //pass to the next player to "give out cards" to the player after
                this.playerTurn = ((this.playerTurn + 2) % 4)

                //hand out cards for suit selection 3+2
                for (let i = this.playerTurn; i < this.playerTurn + 4; i++) {
                    const cards_to_add = this.mainDeck.grabCardsFromTop(3)
                    this.hands[i % 4].addCards(cards_to_add)
                }

                for (let i = this.playerTurn; i < this.playerTurn + 4; i++) {
                    const cards_to_add = this.mainDeck.grabCardsFromTop(2)
                    this.hands[i % 4].addCards(cards_to_add)
                }

                this.status = this.status_options[1]

                return true
            }
            else { return false }
        }
    }

    callSuit(playername, calledSuit, modifier) {
        if (this.checkSuitCallValid(playername, calledSuit, modifier)) {
            if (calledSuit != 'P') {
                // figure out call info
                this.suit = calledSuit;
                this.modifier = modifier;
                this.consecutivePasses = 0;

                // figure out caller info
                this.caller = playername;
                this.callerTeam = this.getPlayerTeam(playername)

                //Ax4 is the max suit call
                if (calledSuit == 'A' && modifier == 4) {
                    this.status = this.status_options[2];
                }
            }
            else {
                this.consecutivePasses++;
                //start round if three passes
                if (this.consecutivePasses == 3) {
                    if (this.suit) this.status = this.status_options[2];
                }
                //end round if four passes - also return cards to main deck
                if (this.consecutivePasses == 4) {
                    this.status = this.status_options[4];
                    for (const hand of this.hands)
                        this.mainDeck.addCardsToTop(hand.grabCardsFromTop(hand.cards.length));
                }

            }
            this.playerTurn = ((this.playerTurn + 1) % 4)
            return true;
        }
    }

    checkSuitCallValid(playername, calledSuit, modifier) {
        //check if it's time to call suits at all
        if (this.status != this.status_options[1]) return false;
        //check if it's the player's turn to call
        if (playername != this.players[this.playerTurn]) return false;
        //check if called suit is pass
        if (calledSuit == 'P') return true;
        //check if suit is valid
        const suitIndex = this.suit_ranks.indexOf(calledSuit);
        if (suitIndex == -1) return false;
        //check if modifier is valid
        if (!(modifier == 1 || modifier == 2 || modifier == 4)) return false;

        //check if suit is not lower ranked
        const currentSuitIndex = this.suit_ranks.indexOf(this.suit);
        if (suitIndex <= currentSuitIndex) {
            //check if multiplier is being changed
            if (suitIndex == currentSuitIndex) {
                // check if new mofier is bigger
                if (modifier <= this.modifier) return false
                else {
                    //check if new modifier is not too big
                    if (modifier / this.modifier != 2) return false
                    //check if new modifier wasn't called by the same team...
                    const team = this.getPlayerTeam(playername)
                    if (this.callerTeam == team) return false;
                }
            }
            else return false
        }

        return true
    }

    getValidPlayerSuitCalls(playerName) {
        //check if it's time to call suits at all
        if (this.status != this.status_options[1]) return [];
        //check if it's the player's turn to call
        if (playerName != this.players[this.playerTurn]) return [];

        const validSuits = ['P']

        if (this.suit) {
            const suitIndex = this.suit_ranks.indexOf(this.suit);
            //check for higher suit calls
            for (let i = suitIndex; i < this.suit_ranks.length; i++)
                if (this.checkSuitCallValid(playerName, this.suit_ranks[i], 1)) validSuits.push(this.suit_ranks[i])

            //check for higher modifier calls
            if (this.checkSuitCallValid(playerName, this.suit, 2)) validSuits.push('x2')
            if (this.checkSuitCallValid(playerName, this.suit, 4)) validSuits.push('x4')
        }
        else {
            // if no one has announced so far everything is fair game
            validSuits.push('C')
            validSuits.push('H')
            validSuits.push('D')
            validSuits.push('S')
            validSuits.push('N')
            validSuits.push('A')
        }
        return validSuits;
    }

    getPlayerHand(playerName) {
        const pIndex = this.players.indexOf(playerName);
        return this.hands[pIndex]
    }

    getPlayerTeam(playerName) {
        //this is stupeed
        let callerTeam = 1
        const pIndex = this.players.indexOf(playerName);
        if (pIndex == 0 || pIndex == 2) callerTeam = 0;
        return callerTeam;
    }

    initPlayStage() {
        if (this.status == this.status_options[2]) {
            //reset the player turn based on round number
            this.playerTurn = this.roundNum % 4;
            this.playerTurn = ((this.playerTurn + 2) % 4)

            //give out the rest of the cards (3 each)
            for (let i = this.playerTurn; i < this.playerTurn + 4; i++) {
                const cards_to_add = this.mainDeck.grabCardsFromTop(3)
                this.hands[i % 4].addCards(cards_to_add)
            }

            this.status = this.status_options[3]
        }
    }

    // NOTE: after this function has been called by the server, check for new premiums - belote may have been anounced automatically :/
    placeCard(playerName, cardSuit, cardRank) {
        // check if card CAN be placed on table
        if (!this.checkIfCardCanBePlaced(playerName, cardSuit, cardRank)) return -1;

        // check if player has the card they want to place and find it's index
        let hand = this.hands[this.playerTurn]
        let index = -1;
        for (const card of hand.cards) if (card.rank == cardRank && card.suit == cardSuit) index = hand.cards.indexOf(card);
        if (index == -1) return -2

        // check for belote premium
        if (cardRank == 'Q' || cardRank == 'K') {
            const premiumOptions = this.getPlayerPremiumOptions(playerName).B
            for (const option of premiumOptions) {
                // this is a bit of a dirty hack but it works
                // tbh I'm sick and tired of this game's rules
                if (cardRank == 'Q' && option[0].rank == 'Q' && cardSuit == option[0].suit) {
                    this.anouncePlayerPremium(playerName, option, 'B')
                }
                if (cardRank == 'K' && option[1].rank == 'K' && cardSuit == option[0].suit) {
                    this.anouncePlayerPremium(playerName, option, 'B')
                }
            }

        }

        // place card from hand onto table
        const card = hand.placeCard(index)
        this.cardsOnTable.addCardToTop(card)
        // console.log(this.cardsOnTable)


        if (this.cardsOnTable.cards.length == 4) {
            const strongest = this.getStrongestCard(this.cardsOnTable.cards)
            //add cards to history
            this.playedCardHistory.push({
                cards: [...this.cardsOnTable.cards],
                strongest: strongest
            })

            this.playerTurn = this.players.indexOf(strongest.placedBy)
            this.teamPiles[this.getPlayerTeam(strongest.placedBy)].addCardsToTop(this.cardsOnTable.grabCardsFromTop(4))
            // count number of hands that each team collects to their piles
            this.teamNumberOfHands[this.getPlayerTeam(strongest.placedBy)]++

            //check if hands are empty - game should be over
            let empty = true
            for (const hand of this.hands) if (hand.cards.length != 0) empty = false;

            if (empty) {
                // ** calculate points here **
                // calc pile points
                this.teamCardScores[0] = this.calculatePilePoints(this.teamPiles[0])
                this.teamCardScores[1] = this.calculatePilePoints(this.teamPiles[1])
                // calc premium points
                this.valid_premiums = this.getValidPremiums()
                for (const premium of this.valid_premiums)
                    this.teamPremiumScores[this.getPlayerTeam(premium.belongsTo)] += premium.points;

                // ** return cards to main deck in the order they were added to the piles **
                this.mainDeck.addCardsToTop(this.teamPiles[0].grabCardsFromTop(this.teamPiles[0].cards.length));
                this.mainDeck.addCardsToTop(this.teamPiles[1].grabCardsFromTop(this.teamPiles[1].cards.length));

                this.status = this.status_options[4];
            }
            return true;
        }
        else {
            this.playerTurn = (this.playerTurn + 1) % 4;
            return true;
        }
    }

    calculatePilePoints(teamPile) {
        let points = 0;

        for (const card of teamPile.cards) {
            // these cards are always 0
            if (card.rank == '7' || card.rank == '8') continue;
            // these cards change between trump to no trump
            if (card.suit == this.suit || this.suit == 'A') {
                if (card.rank == '9') {
                    points = points + 14;
                    continue;
                }
                if (card.rank == 'J') {
                    points = points + 20;
                    continue;
                }
            }
            else {
                if (card.rank == '9') continue;
                if (card.rank == 'J') {
                    points = points + 2;
                    continue;
                }
            }
            // these cards are always the same value
            if (card.rank == 'Q') {
                points = points + 3;
                continue;
            }
            if (card.rank == 'K') {
                points = points + 4;
                continue;
            }
            if (card.rank == '10') {
                points = points + 10;
                continue;
            }
            if (card.rank == 'A') {
                points = points + 11;
                continue;
            }
        }

        return points;
    }

    getValidPremiums() {
        const valid_premiums = [];
        for (const premium of this.premiums) {
            if (premium.premiumType == 'B' && premium.valid) {
                valid_premiums.push(premium);
            }
        }
        return valid_premiums;
    }

    // only allow for belote premium when player is playing Q or K - handled in place card function
    // make sure players don't call the same premium twice - handled in getPlayerPremiumOptions()
    anouncePlayerPremium(playerName, cards, premiumType) {
        const sortedCards = this.sortCards(cards)
        const premiumOptions = this.getPlayerPremiumOptions(playerName);
        for (const cardSeries of premiumOptions[premiumType]) {
            if (cardSeries.length > 0)
                if (this.checkIfCardArraysMatch(cardSeries, sortedCards)) {
                    this.premiums.push(new Premium(playerName, premiumType, this.suit, cards))
                    return true;
                }
        }
        return false;
    }

    checkIfCardArraysMatch(arr1, arr2) {
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i].rank != arr2[i].rank) return false;
            if (arr1[i].suit != arr2[i].suit) return false;
        }
        return true
    }

    getPlayerPremiumOptions(playerName) {
        let options = { 'B': [] };
        if (playerName != this.players[this.playerTurn]) return options;
        if (this.suit == 'N') return options;
    
        const playerHand = this.hands[this.playerTurn];
        options['B'] = this.checkForBelotePremiums(playerHand);
        return options;
    }

    checkForBelotePremiums(hand) {
        const available_premiums = [];
        const cardsBySuit = this.sortCards(hand.cards);

        for (let i = 0; i < cardsBySuit.length - 1; i++) {
            if (cardsBySuit[i].rank == 'Q' && cardsBySuit[i + 1].rank == 'K' && cardsBySuit[i].suit == cardsBySuit[i + 1].suit) {
                if (new Premium(this.players[this.playerTurn], 'B', this.suit, [cardsBySuit[i], cardsBySuit[i + 1]]).valid) {
                    available_premiums.push([cardsBySuit[i], cardsBySuit[i + 1]]);
                }
            }
        }
        return available_premiums;
    }

    checkForCardSeriesPremiums(hand) {
        const available_premiums = [];
        //split cards into suits
        const cardsBySuit = []
        for (const suit of [...this.suit_ranks].slice(0, 4)) {
            const cards = []
            for (const card of hand.cards) {
                if (card.suit == suit) cards.push(card)
            }
            cardsBySuit.push(cards)
        }
        //sort cards seperately
        const sortedCardsPerSuit = []
        for (let cards of cardsBySuit) {
            sortedCardsPerSuit.push(this.sortCards(cards))
        }
        //check every suit for premiums
        for (let cards of sortedCardsPerSuit) {
            if (cards.length < 3) continue;
            // check for subseries - e.g.: 7-8-9---J-Q-K-A
            const allSeries = []
            let currentSeries = [cards[0]]
            for (let i = 0; i < cards.length - 1; i++) {
                const currentIndex = this.premium_card_order.indexOf(cards[i].rank);
                const nextIndex = this.premium_card_order.indexOf(cards[i + 1].rank);
                // add next card to index
                if (nextIndex - currentIndex == 1) {
                    currentSeries.push(cards[i + 1])
                }
                // stop series and begin a new one
                else {
                    allSeries.push(currentSeries);
                    currentSeries = []
                    currentSeries.push(cards[i + 1])
                }
            }
            allSeries.push(currentSeries);
            // console.log(allSeries)

            // just to be sure I'm testing if what I'm giving a valid premium option here, this function is complicated enough as is
            for (const series of allSeries) {
                // console.log(series)
                const testPremium = new Premium(this.players[this.playerTurn], 'C', this.suit, series)
                if (testPremium.valid) {
                    available_premiums.push(series)
                }
            }
        }

        return available_premiums;
    }

    sortCards(cards) {
        const sortedCards = [...cards]
        const compareCards = (card1, card2) => {
            let card1rankIndex = this.premium_card_order.indexOf(card1.rank);
            let card2rankIndex = this.premium_card_order.indexOf(card2.rank);
            if (card1rankIndex > card2rankIndex) return 1;
            if (card1rankIndex < card2rankIndex) return -1;
            return 0;
        }
        return sortedCards.sort(compareCards);

    }

    checkFor4CPremiums(hand) {
        const available_premiums = [];

        for (const premium_option of this.premium_card_order) {
            let cards = [];
            for (const card of hand.cards) {
                if (card.rank == premium_option)
                    cards.push(card)
            }
            if (cards.length == 4) available_premiums.push([...cards]);
        }
        return available_premiums;
    }

    getPlayerOptions(playerName) {
        if (playerName != this.players[this.playerTurn]) return [];
        else {
            const playerHand = this.hands[this.playerTurn];
            const options = []
            for (let cardFromHand of playerHand.cards) {
                if (this.checkIfCardCanBePlaced(playerName, cardFromHand.suit, cardFromHand.rank)) {
                    options.push(cardFromHand)
                }
            }
            return options
        }
    }

    checkIfCardCanBePlaced(playerName, cardSuit, cardRank) {
        // check if it's the player's turn
        if (playerName != this.players[this.playerTurn]) return false;

        // check if player hasn't already played this round
        for (const card of this.cardsOnTable.cards)
            if (card.placedBy == playerName) return false;

        if (this.cardsOnTable.cards.length == 0) return true
        else {
            // set up some vars
            const initialCard = this.cardsOnTable.cards[0]
            const strongestCard = this.getStrongestCard(this.cardsOnTable.cards)
            const holdingTeam = this.getPlayerTeam(strongestCard.placedBy)
            const playerHand = this.hands[this.playerTurn]

            // check if player is holding a card from the requested suit
            let player_has_requested_suit = false;
            for (const card of playerHand.cards)
                if (card.suit == initialCard.suit) {
                    player_has_requested_suit = true;
                    break;
                }

            // handle NoTrumps logic for placing cards - players can always put cards from the initial suit on NoTrumps, no matter their strenght
            if (this.suit === 'N')
                if (player_has_requested_suit)
                    if (cardSuit === initialCard['suit'])
                        return true

            // check if player is holding a stronger card from the same suit
            let player_has_stronger_card_from_suit = false;
            if (player_has_requested_suit)
                for (const cardFromHand of playerHand.cards) {
                    if (cardFromHand.suit == initialCard.suit) {
                        if (this.compareCardStrength(strongestCard.suit, strongestCard.rank, cardFromHand.suit, cardFromHand.rank) == 1) {
                            player_has_stronger_card_from_suit = true;
                            break;
                        }

                    }
                }

            // check if player is holding a stronger card from any suit
            let player_has_stronger_card_from_any_suit = false;
            for (const cardFromHand of playerHand.cards) {
                if (this.compareCardStrength(strongestCard.suit, strongestCard.rank, cardFromHand.suit, cardFromHand.rank) == 1) {
                    player_has_stronger_card_from_any_suit = true;
                    break;
                }
            }

            //check if player team is holding this round
            if (holdingTeam == this.getPlayerTeam(playerName)) {
                //if card is trump or suit is A you must give higher if you can
                if (initialCard.suit === this.suit || this.suit === 'A') {
                    if (player_has_stronger_card_from_suit) {
                        if (initialCard.suit == cardSuit &&
                            this.compareCardStrength(strongestCard.suit, strongestCard.rank, cardSuit, cardRank) == 1)
                            return true;
                        else return false;
                    }
                }

                // if player has the same suit he must respond
                if (player_has_requested_suit) {
                    if (initialCard.suit == cardSuit) return true;
                    else return false
                }
                // if player does not have same suit he can give whatever he wants
                else return true;
            }
            else {
                // if player has the same suit he must respond higher if possible
                if (player_has_requested_suit) {
                    if (player_has_stronger_card_from_suit) {
                        if (initialCard.suit == cardSuit &&
                            this.compareCardStrength(strongestCard.suit, strongestCard.rank, cardSuit, cardRank) == 1)
                            return true;
                        else return false;
                    }
                    // if player cannot respond with higher, he must respond with same suit
                    else
                        if (initialCard.suit == cardSuit) return true;
                        else return false;
                }
                // if player cannot respond with same suit, he can trump the card
                else {
                    if (player_has_stronger_card_from_any_suit) {
                        if (this.compareCardStrength(strongestCard.suit, strongestCard.rank, cardSuit, cardRank) == 1)
                            return true;
                        else return false;
                    }
                    // if player cannot trump or respond he can give whatever ge wants  
                    else {
                        return true
                    }
                }
            }

        }
    }

    // assume arr is in order the cards were placed
    getStrongestCard(CardArr) {
        let strongest = CardArr[0];
        for (const card of CardArr) {
            if (this.compareCardStrength(strongest.suit, strongest.rank, card.suit, card.rank) == 1)
                strongest = card;
        }
        return strongest;
    }

    // Returns 0 if 0 is stronger and 1 if 1 is stronger
    // assume card 0 was placed first! 
    compareCardStrength(suit0, rank0, suit1, rank1) {
        //check if cards are the same suit
        if (suit0 == suit1) {
            //is this suit in the trump rank order?
            if (this.suit == suit1 || this.suit == 'A') {
                //then compare using the trump card order
                if (this.trump_card_order.indexOf(rank0) > this.trump_card_order.indexOf(rank1)) return 0
                else return 1
            }
            else {
                //then compare using the no-trump card order 
                if (this.no_trump_card_order.indexOf(rank0) > this.no_trump_card_order.indexOf(rank1)) return 0
                else return 1
            }
        }
        else {
            if (this.suit == 'A' || this.suit == 'N') {
                //handle all trumps and no trumps - new card always loses
                return 0
            }
            else {
                // if suit1 is trump it always wins, else it should be suit0, because assume 0 was given first
                if (suit1 == this.suit) return 1
                else return 0
            }
        }
    }

    getRoundStatus() {
        // save some bandwidth
        const premiumInfo = []
        for (const premium of this.premiums) {
            premiumInfo.push({
                belongsTo: premium.belongsTo,
                premiumType: premium.premiumType,
                cards: premium.cards,
                valid: premium.valid,
                points: premium.points
            })
        }

        return {
            status: this.status,
            pTurn: this.playerTurn,
            pTurnName: this.players[this.playerTurn],
            players: this.players,
            cardsOnTable: this.cardsOnTable.cards,
            handHistory: this.playedCardHistory,
            premiums: premiumInfo,
            suitInfo: {
                suit: this.suit,
                modifier: this.modifier,
                caller: this.caller,
                callerTeam: this.callerTeam
            },
            handSizes: [
                this.hands[0].cards.length,
                this.hands[1].cards.length,
                this.hands[2].cards.length,
                this.hands[3].cards.length
            ],
            pileSizes: [
                this.teamPiles[0].cards.length,
                this.teamPiles[1].cards.length,
            ]
        }
    }

    getRoundResults() {
        return {
            team_hand_count: this.teamNumberOfHands,
            card_scores: this.teamCardScores,
            premium_scores: this.teamPremiumScores,
            suit: this.suit,
            callerTeam: this.callerTeam,
            lastHandTeam: this.getPlayerTeam(this.playerTurn),
            modifier: this.modifier,
            validPremiums: this.valid_premiums
        }
    }
}

class Game {
    constructor(players) {
        //teams are 'crossed' in the rounds
        this.t1 = new Team(players[0], players[1]);
        this.t2 = new Team(players[2], players[3]);
        this.teamsValid = this.t1.isReady() && this.t2.isReady();
        if (this.teamsValid) {
            this.teamScores = [0, 0];
            this.teamLastRoundScores = [0, 0];
            this.roundNum = 0;
            this.hangingPoints = 0
            this.gameStatus = 'in_progress';
            this.winningTeam = null;
            this.consecutivePasses = 0;

            this.deck = new Deck();
            this.deck.initDeck();
            this.pastRounds = [];

            this.currentRound = new Round(this.deck, this.t1, this.t2, this.roundNum);
        }
    }

    endCurrentRound() {
        // get deck from current round and cleanup it from placedBy 
        this.deck = this.currentRound.mainDeck;
        for (const card of this.deck.cards)
            delete card.placedBy;


        // check if game was played or passed
        if (this.currentRound.consecutivePasses == 4) {
            this.consecutivePasses++;
            // shuffle cards on 4 passes
            if (this.consecutivePasses == 4) {
                this.deck.shuffle();
                this.consecutivePasses = 0;
            }
        }

        // calc game points from round 
        // console.log(this.calculateGamePoints())
        const pointsArr = this.calculateGamePoints()
        // console.log(pointsArr)
        // memorise score from last round so that the difference can be shown in the front end
        this.teamLastRoundScores[0] = this.teamScores[0]
        this.teamLastRoundScores[1] = this.teamScores[1]

        this.teamScores[0] += pointsArr[0]
        this.teamScores[1] += pointsArr[1]

        // check if game is over
        if (this.teamScores[0] > 151 || this.teamScores[1] > 151) {
            if (this.teamScores[0] > 151) this.winningTeam = 0
            else this.winningTeam = 1
            this.gameStatus = 'over'
        }
        else {
            // archive current round and start new one
            this.pastRounds.push(this.currentRound);
            this.roundNum++;
            this.currentRound = new Round(this.deck, this.t1, this.t2, this.roundNum);
        }
    }

    calculateGamePoints() {
        let final_points = [0, 0];
    
        const roundInfo = this.currentRound.getRoundResults();
        // Vérifier si le jeu a été joué
        if (roundInfo.suit) {
            // Calcul des scores d'équipe
            const teamTotalScores = [0, 0];
            teamTotalScores[0] += roundInfo.card_scores[0];
            teamTotalScores[1] += roundInfo.card_scores[1];
    
            // Ajouter les points de Belote uniquement
            teamTotalScores[0] += roundInfo.premium_scores[0];
            teamTotalScores[1] += roundInfo.premium_scores[1];
    
            // Calculer les 10 points pour la dernière main
            teamTotalScores[roundInfo.lastHandTeam] += 10;
    
            // Doubler les points si le jeu est en "sans atout" (No Trump)
            if (roundInfo.suit == 'N') {
                teamTotalScores[0] *= 2;
                teamTotalScores[1] *= 2;
            }
    
            // Vérifier si l'équipe appelante a perdu
            if (teamTotalScores[roundInfo.callerTeam] < teamTotalScores[(roundInfo.callerTeam + 1) % 2]) {
                // Transférer les points de l'équipe appelante à l'autre équipe
                teamTotalScores[(roundInfo.callerTeam + 1) % 2] += teamTotalScores[roundInfo.callerTeam];
                teamTotalScores[roundInfo.callerTeam] = 0;
    
                // Appliquer le multiplicateur
                if (roundInfo.suit === 'A') final_points[(roundInfo.callerTeam + 1) % 2] += 2;
                teamTotalScores[(roundInfo.callerTeam + 1) % 2] *= roundInfo.modifier;
                final_points[(roundInfo.callerTeam + 1) % 2] = Math.floor((teamTotalScores[(roundInfo.callerTeam + 1) % 2] + 5) / 10);
            } else {
                // Calcul des points en cas d'égalité
                if (roundInfo.suit == 'N') {
                    teamTotalScores[roundInfo.callerTeam] += 5;
                    teamTotalScores[(roundInfo.callerTeam + 1) % 2] += 5;
                } else if (roundInfo.suit == 'A') {
                    teamTotalScores[roundInfo.callerTeam] += 5;
                    teamTotalScores[(roundInfo.callerTeam + 1) % 2] += 6;
                } else {
                    teamTotalScores[roundInfo.callerTeam] += 3;
                    teamTotalScores[(roundInfo.callerTeam + 1) % 2] += 4;
                }
    
                final_points[0] = Math.floor(teamTotalScores[0] * roundInfo.modifier / 10);
                final_points[1] = Math.floor(teamTotalScores[1] * roundInfo.modifier / 10);
    
                // En cas d'égalité des scores, points suspendus pour l'équipe en défense
                if (teamTotalScores[roundInfo.callerTeam] == teamTotalScores[(roundInfo.callerTeam + 1) % 2]) {
                    if (roundInfo.modifier == 1) {
                        this.hangingPoints += final_points[roundInfo.callerTeam];
                        final_points[roundInfo.callerTeam] = 0;
                        teamTotalScores[roundInfo.callerTeam] = 0;
                    } else {
                        this.hangingPoints += final_points[0] + final_points[1];
                        final_points[0] = final_points[1] = 0;
                        teamTotalScores[0] = teamTotalScores[1] = 0;
                    }
                }
            }
    
            // Ajouter 9 points si une équipe a fait toutes les levées
            if (roundInfo.team_hand_count[0] == 0) teamTotalScores[1] += 9;
            if (roundInfo.team_hand_count[1] == 0) teamTotalScores[0] += 9;
        }
    
        // Gérer les points suspendus
        if (this.hangingPoints > 0) {
            if (teamTotalScores[roundInfo.callerTeam] > 0 && teamTotalScores[(roundInfo.callerTeam + 1) % 2] > 0) {
                if (teamTotalScores[roundInfo.callerTeam] != teamTotalScores[(roundInfo.callerTeam + 1) % 2]) {
                    if (teamTotalScores[roundInfo.callerTeam] > teamTotalScores[(roundInfo.callerTeam + 1) % 2]) {
                        final_points[roundInfo.callerTeam] += this.hangingPoints;
                    } else {
                        final_points[(roundInfo.callerTeam + 1) % 2] += this.hangingPoints;
                    }
                }
            }
        }
    
        return final_points;
    }
    

    getGameInfo() {
        return {
            gameStatus: this.gameStatus,
            teams: [[this.t1.p1, this.t2.p1], [this.t1.p2, this.t2.p2]],
            teamScores: this.teamScores,
            teamLastRoundScores: this.teamLastRoundScores,
            roundNum: this.roundNum,
            winningTeam: this.winningTeam,
            consecutivePasses: this.consecutivePasses,
            teamsValid: this.teamsValid
        }
    }
}

module.exports = Game;

// const game = new Game(['s', 'e', 'n', 'w'])
// game.currentRound.splitDeck('s', 4)
// game.currentRound.callSuit('n', 'P', 1)
// game.currentRound.callSuit('w', 'P', 1)
// game.currentRound.callSuit('s', 'P', 1)
// game.currentRound.callSuit('e', 'P', 1)

// console.log(game.currentRound)
// console.log(game.endCurrentRound())
// console.log(game.currentRound)
// console.log()
