// Matching engine for broker-tenant recommendations
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

export class MatchingEngine {
    constructor(db) {
        this.db = db;
    }

    // Calculate similarity score between broker and tenant
    calculateMatchScore(broker, tenant) {
        let score = 0;
        const maxScore = 100;

        // Industry match (30% weight)
        const industryScore = this.calculateIndustryScore(broker, tenant);
        score += industryScore * 0.3;

        // Location match (30% weight)
        const locationScore = this.calculateLocationScore(broker, tenant);
        score += locationScore * 0.3;

        // Property type match (20% weight)
        const propertyTypeScore = this.calculatePropertyTypeScore(broker, tenant);
        score += propertyTypeScore * 0.2;

        // Deal size match (20% weight)
        const dealSizeScore = this.calculateDealSizeScore(broker, tenant);
        score += dealSizeScore * 0.2;

        return Math.min(score, maxScore);
    }

    calculateIndustryScore(broker, tenant) {
        let score = 0;

        // Check primary industry match
        const primaryIndustryMatch = broker.industries.find(i => i.name === tenant.industry);
        if (primaryIndustryMatch) {
            score += 80; // Base score for primary industry match
        }

        // Check secondary industries match
        if (tenant.secondaryIndustries && tenant.secondaryIndustries.length > 0) {
            const secondaryMatches = broker.industries.filter(i => 
                tenant.secondaryIndustries.includes(i.name)
            );
            
            if (secondaryMatches.length > 0) {
                // Add points for each matching secondary industry
                score += Math.min(20, secondaryMatches.length * 10); // Max 20 points for secondary matches
            }
        }

        return Math.min(score, 100);
    }

    calculateLocationScore(broker, tenant) {
        let score = 0;

        // Exact city match
        if (broker.officeCity.toLowerCase() === tenant.city.toLowerCase()) {
            score += 60;
        }

        // State match
        if (broker.officeState === tenant.state) {
            score += 20;
        }

        // Service area match
        const serviceAreas = broker.serviceArea.toLowerCase().split(',').map(area => area.trim());
        const tenantZip = tenant.zip;
        const tenantMetro = `${tenant.city} Metro`.toLowerCase();

        if (serviceAreas.includes(tenantZip) || serviceAreas.some(area => area.includes(tenantMetro))) {
            score += 20;
        }

        return score;
    }

    calculatePropertyTypeScore(broker, tenant) {
        if (!broker.propertyTypes || !tenant.preferredPropertyTypes) {
            return 0;
        }

        const matchingTypes = broker.propertyTypes.filter(type => 
            tenant.preferredPropertyTypes.includes(type)
        );

        return (matchingTypes.length / tenant.preferredPropertyTypes.length) * 100;
    }

    calculateDealSizeScore(broker, tenant) {
        if (!broker.dealSizes || !tenant.size) {
            return 0;
        }

        let score = 0;
        const size = tenant.size;

        // Convert broker's deal size ranges to numbers for comparison
        const matchingRanges = broker.dealSizes.filter(range => {
            if (range === "Under 1000 sqft" && size < 1000) return true;
            if (range === "1000-2500 sqft" && size >= 1000 && size <= 2500) return true;
            if (range === "2500-5000 sqft" && size >= 2500 && size <= 5000) return true;
            if (range === "5000-10000 sqft" && size >= 5000 && size <= 10000) return true;
            if (range === "Over 10000 sqft" && size > 10000) return true;
            return false;
        });

        if (matchingRanges.length > 0) {
            score = 100;
        }

        // Adjust score based on tenant's size flexibility
        if (tenant.sizeFlexibility === "Exact" && matchingRanges.length === 1) {
            score = 100;
        } else if (tenant.sizeFlexibility === "Somewhat" && matchingRanges.length >= 1) {
            score = 90;
        } else if (tenant.sizeFlexibility === "Very" && matchingRanges.length >= 1) {
            score = 80;
        }

        return score;
    }

    // Get recommended brokers for a tenant
    async getRecommendedBrokers(tenant, limit = 5) {
        try {
            // Get all approved brokers
            const brokersRef = collection(this.db, 'brokers');
            const q = query(brokersRef, where("status", "==", "approved"));
            const brokerSnapshot = await getDocs(q);

            // Calculate scores for each broker
            const scoredBrokers = [];
            brokerSnapshot.forEach(doc => {
                const broker = doc.data();
                const score = this.calculateMatchScore(broker, tenant);
                scoredBrokers.push({
                    id: doc.id,
                    broker: broker,
                    score: score,
                    matchDetails: {
                        industryScore: this.calculateIndustryScore(broker, tenant),
                        locationScore: this.calculateLocationScore(broker, tenant),
                        propertyTypeScore: this.calculatePropertyTypeScore(broker, tenant),
                        dealSizeScore: this.calculateDealSizeScore(broker, tenant)
                    }
                });
            });

            // Sort by score and return top matches
            return scoredBrokers
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map(item => ({
                    ...item.broker,
                    matchScore: item.score,
                    matchDetails: item.matchDetails,
                    id: item.id
                }));
        } catch (error) {
            console.error("Error getting recommendations:", error);
            throw error;
        }
    }
} 