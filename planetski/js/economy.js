/**
 * PlanetSki - 3D Ski Resort Builder
 * Modul: Wirtschaftssystem
 */

class Economy {
    constructor() {
        this.money = 100000; // Startkapital
        this.reputation = 50; // 0-100
        this.visitors = 0;
        this.dailyVisitors = 0;
        this.totalVisitors = 0;
        
        // Einkommensströme
        this.liftTickets = 0;
        this.foodRevenue = 0;
        this.rentalRevenue = 0;
        this.hotelRevenue = 0;
        
        // Ausgaben
        this.maintenance = 0;
        this.staffCosts = 0;
        this.energyCosts = 0;
        
        // Statistiken
        this.day = 1;
        this.season = 'winter';
        this.weather = 'sunny';
        
        // Preise
        this.prices = {
            dayTicket: 55,
            halfDay: 35,
            seasonTicket: 800,
            skiRental: 25,
            food: 15,
            hotel: 120
        };
    }
    
    update(deltaTime, lifts, buildings) {
        // Besucher basierend auf Reputation und Wetter generieren
        this.generateVisitors(deltaTime, lifts);
        
        // Einnahmen berechnen
        this.calculateRevenue(deltaTime, lifts, buildings);
        
        // Ausgaben berechnen
        this.calculateExpenses(deltaTime, lifts, buildings);
        
        // Geld aktualisieren
        this.money += (this.liftTickets + this.foodRevenue + this.rentalRevenue + this.hotelRevenue) * deltaTime;
        this.money -= (this.maintenance + this.staffCosts + this.energyCosts) * deltaTime;
    }
    
    generateVisitors(deltaTime, lifts) {
        // Basis-Besucherzahl basierend auf Liftkapazität
        const totalCapacity = lifts.reduce((sum, lift) => {
            return sum + (lift.config ? lift.config.capacity : 0);
        }, 0);
        
        // Wetter-Modifier
        const weatherMod = {
            'sunny': 1.2,
            'cloudy': 1.0,
            'snowing': 1.3,
            'foggy': 0.6,
            'stormy': 0.2
        }[this.weather] || 1.0;
        
        // Reputation-Modifier
        const repMod = 0.5 + (this.reputation / 100);
        
        // Neue Besucher
        const newVisitors = (totalCapacity * 0.1 * weatherMod * repMod) * deltaTime;
        this.dailyVisitors += newVisitors;
        this.totalVisitors += newVisitors;
        this.visitors = Math.floor(this.dailyVisitors);
    }
    
    calculateRevenue(deltaTime, lifts, buildings) {
        // Liftkarten
        const ticketSales = this.dailyVisitors * this.prices.dayTicket * 0.3; // 30% kaufen Tagesticket
        this.liftTickets = ticketSales / 86400; // Pro Sekunde
        
        // Gastronomie
        const huts = buildings.filter(b => b.type === 'hut' || b.type === 'restaurant');
        const foodSales = huts.reduce((sum, hut) => {
            const visitors = Math.min(hut.config.incomePerVisitor * 10, this.dailyVisitors * 0.5);
            return sum + visitors * this.prices.food;
        }, 0);
        this.foodRevenue = foodSales / 86400;
        
        // Hotels
        const hotels = buildings.filter(b => b.type === 'hotel' || b.type === 'hostel');
        this.hotelRevenue = hotels.reduce((sum, hotel) => sum + hotel.config.income, 0) / 86400;
    }
    
    calculateExpenses(deltaTime, lifts, buildings) {
        // Wartung pro Lift
        this.maintenance = lifts.reduce((sum, lift) => {
            const baseCost = lift.config ? lift.config.cost * 0.001 : 0;
            return sum + baseCost;
        }, 0) / 86400;
        
        // Personal-Kosten
        const staffPerLift = 3;
        const staffPerBuilding = 2;
        const staffCostPerHour = 25;
        this.staffCosts = ((lifts.length * staffPerLift + buildings.length * staffPerBuilding) * staffCostPerHour) / 3600;
        
        // Energie
        this.energyCosts = lifts.reduce((sum, lift) => {
            const kw = lift.config ? lift.config.capacity / 100 : 10;
            return sum + kw * 0.15; // 15ct/kWh
        }, 0) / 3600;
    }
    
    nextDay() {
        this.day++;
        this.dailyVisitors = 0;
        
        // Wetter ändern
        const weathers = ['sunny', 'sunny', 'cloudy', 'cloudy', 'snowing', 'foggy'];
        this.weather = weathers[Math.floor(Math.random() * weathers.length)];
        
        // Saison-Wechsel
        if (this.day > 90) {
            this.day = 1;
            this.season = this.season === 'winter' ? 'summer' : 'winter';
        }
    }
    
    getStats() {
        return {
            money: Math.floor(this.money),
            visitors: this.visitors,
            totalVisitors: Math.floor(this.totalVisitors),
            reputation: Math.floor(this.reputation),
            day: this.day,
            season: this.season,
            weather: this.weather,
            income: {
                liftTickets: Math.floor(this.liftTickets * 86400),
                food: Math.floor(this.foodRevenue * 86400),
                hotel: Math.floor(this.hotelRevenue * 86400)
            },
            expenses: {
                maintenance: Math.floor(this.maintenance * 86400),
                staff: Math.floor(this.staffCosts * 86400),
                energy: Math.floor(this.energyCosts * 86400)
            }
        };
    }
    
    canAfford(amount) {
        return this.money >= amount;
    }
    
    spend(amount) {
        if (this.canAfford(amount)) {
            this.money -= amount;
            return true;
        }
        return false;
    }
    
    earn(amount) {
        this.money += amount;
    }
    
    // Cheatcode: Unendlich Geld
    cheatMoney() {
        this.money += 10000000; // 10 Millionen
        return '💰 CHEAT ACTIVATED: +10,000,000€!';
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Economy };
}