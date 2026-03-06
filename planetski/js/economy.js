/**
 * PlanetSki - 3D Ski Resort Builder
 * Modul: Wirtschaftssystem
 */

class Economy {
    constructor() {
        this.money = 10000;           // Startkapital
        this.reputation = 50;         // 0-100, beeinflusst Besucheranzahl
        this.visitors = 0;            // Aktuelle Besucher
        this.totalVisitors = 0;       // Gesamtbesucher
        this.day = 1;
        this.hour = 8;                // Start um 8 Uhr
        
        // Einkommensquellen
        this.income = {
            liftTickets: 0,
            food: 0,
            hotel: 0,
            parking: 0,
            shop: 0
        };
        
        // Ausgaben
        this.expenses = {
            maintenance: 0,
            staff: 0,
            energy: 0
        };
        
        // Preise
        this.prices = {
            dayTicket: 45,      // Tageskarte
            halfDayTicket: 30,  // Halbtagskarte
            food: 15,           // Durchschnittliches Essen
            hotelNight: 120     // Hotel pro Nacht
        };
        
        this.lastUpdate = Date.now();
        
        // UI-Update Callback
        this.onUpdate = null;
    }
    
    update(deltaTime) {
        // Zeit fortschreiten (1 Stunde = 30 Sekunden Realzeit)
        this.lastUpdate += deltaTime;
        
        if (this.lastUpdate > 30000) { // Alle 30 Sekunden = 1 Spielstunde
            this.lastUpdate = 0;
            this.hour++;
            
            if (this.hour >= 22) { // Resort schließt um 22 Uhr
                this.endDay();
            } else if (this.hour === 8) { // Öffnet um 8 Uhr
                this.startDay();
            }
            
            // Stündliche Updates
            this.calculateHourlyIncome();
        }
    }
    
    startDay() {
        // Neue Besucher basierend auf Reputation und Wetter
        const baseVisitors = 50;
        const reputationBonus = this.reputation * 2;
        const newVisitors = Math.floor(baseVisitors + reputationBonus + Math.random() * 50);
        
        this.visitors = newVisitors;
        this.totalVisitors += newVisitors;
        
        // Liftkarten-Einnahmen
        const tickets = Math.floor(newVisitors * 0.9); // 90% kaufen Tageskarten
        const halfDay = Math.floor(newVisitors * 0.1); // 10% Halbtags
        
        this.income.liftTickets += tickets * this.prices.dayTicket;
        this.income.liftTickets += halfDay * this.prices.halfDayTicket;
        
        this.money += this.income.liftTickets;
        
        this.notify(`Tag ${this.day} gestartet! ${newVisitors} Gäste im Resort.`);
        this.triggerUpdate();
    }
    
    endDay() {
        // Tägliche Kosten
        this.calculateDailyExpenses();
        
        // Übersicht
        const dayIncome = Object.values(this.income).reduce((a, b) => a + b, 0);
        const dayExpenses = Object.values(this.expenses).reduce((a, b) => a + b, 0);
        const profit = dayIncome - dayExpenses;
        
        // Reputation anpassen basierend auf Profit
        if (profit > 0) {
            this.reputation = Math.min(100, this.reputation + 1);
        } else {
            this.reputation = Math.max(0, this.reputation - 2);
        }
        
        this.notify(`Tag ${this.day} beendet. Profit: ${profit >= 0 ? '+' : ''}${profit.toFixed(0)}€`);
        
        // Reset für nächsten Tag
        this.day++;
        this.hour = 7; // Bereitet sich auf Öffnung vor
        this.visitors = 0;
        
        // Einkommen zurücksetzen
        Object.keys(this.income).forEach(k => this.income[k] = 0);
        Object.keys(this.expenses).forEach(k => this.expenses[k] = 0);
        
        this.triggerUpdate();
    }
    
    calculateHourlyIncome() {
        // Nur während Öffnungszeiten (8-22 Uhr)
        if (this.hour < 8 || this.hour >= 22) return;
        
        const activeVisitors = Math.floor(this.visitors * 0.7); // 70% sind aktiv
        
        // Essen (Mittagspause mehr)
        let foodMultiplier = 0.05;
        if (this.hour === 12 || this.hour === 13) foodMultiplier = 0.3; // Mittag
        
        const foodIncome = activeVisitors * foodMultiplier * this.prices.food;
        this.income.food += foodIncome;
        this.money += foodIncome;
        
        // Hotel (nur Abends)
        if (this.hour >= 18) {
            const hotelIncome = Math.floor(activeVisitors * 0.2) * this.prices.hotelNight;
            this.income.hotel += hotelIncome;
            this.money += hotelIncome;
        }
        
        this.triggerUpdate();
    }
    
    calculateDailyExpenses() {
        // Wartung basierend auf Anzahl der Lifte/Gebäude
        const liftCount = game?.lifts?.length || 0;
        const buildingCount = game?.buildings?.length || 0;
        
        this.expenses.maintenance = liftCount * 200 + buildingCount * 50;
        this.expenses.staff = (liftCount * 3 + buildingCount * 2) * 80; // 3-2 Mitarbeiter pro Einheit
        this.expenses.energy = (liftCount * 100 + buildingCount * 20);
        
        const totalExpenses = Object.values(this.expenses).reduce((a, b) => a + b, 0);
        this.money -= totalExpenses;
        
        return totalExpenses;
    }
    
    canAfford(amount) {
        return this.money >= amount;
    }
    
    spend(amount, reason = '') {
        if (this.canAfford(amount)) {
            this.money -= amount;
            if (reason) {
                console.log(`💸 Ausgabe: ${amount}€ für ${reason}`);
            }
            this.triggerUpdate();
            return true;
        }
        return false;
    }
    
    earn(amount, source = '') {
        this.money += amount;
        if (source && this.income[source] !== undefined) {
            this.income[source] += amount;
        }
        this.triggerUpdate();
    }
    
    getDailyReport() {
        const totalIncome = Object.values(this.income).reduce((a, b) => a + b, 0);
        const totalExpenses = Object.values(this.expenses).reduce((a, b) => a + b, 0);
        
        return {
            day: this.day,
            hour: this.hour,
            visitors: this.visitors,
            totalVisitors: this.totalVisitors,
            money: this.money,
            reputation: this.reputation,
            income: { ...this.income, total: totalIncome },
            expenses: { ...this.expenses, total: totalExpenses },
            profit: totalIncome - totalExpenses
        };
    }
    
    notify(message) {
        console.log(`📢 ${message}`);
        if (window.gameUI) {
            window.gameUI.showNotification(message);
        }
    }
    
    triggerUpdate() {
        if (this.onUpdate) {
            this.onUpdate(this.getDailyReport());
        }
    }
    
    // Preise ändern
    setPrice(category, value) {
        if (this.prices[category] !== undefined) {
            this.prices[category] = Math.max(1, value);
            this.triggerUpdate();
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Economy };
}
