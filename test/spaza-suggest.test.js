
const  assert = require('assert');

const spazaSuggest =require('../spaza-suggest.js');
const pgPromise = require('pg-promise');

// const DATABASE_URL= process.env.DATABASE_URL || "postgresql://codex-coder:pg123@localhost:5432/spaza_suggest";
const DATABASE_URL= process.env.DATABASE_URL || "postgresql://codex123@localhost:5432/spaza_suggest";

const config = { 
	connectionString : DATABASE_URL
}
const pgp = pgPromise();

if (process.env.NODE_ENV == 'production') {
	config.ssl = { 
		rejectUnauthorized : false
	}
}

const db = pgp(config);
const spazasSuggest = spazaSuggest(db);

describe ("The smart spaza", function() {

    beforeEach(async function() {

        await db.none(`delete from accepted_suggestion`);
        await db.none(`delete from suggestion`);
        await db.none(`delete from spaza`);
        await db.none(`delete from spaza_client`);
        
    });

    it("should be able to list areas", async function() {
        
        const areas = await spazasSuggest.areas();
        assert.equal(5, areas.length);
        assert.equal('Khayelitsa - Site C', areas[2].area_name);

    });

    it("should be able to create a Spaza User and return a code", async function() {
        const code = await spazasSuggest.registerClient('spazani');
        assert.ok(code);
    });

    it("should be able to find  a user using a code", async function() {
        const code = await spazasSuggest.registerClient('spazani');
        const client = await spazasSuggest.clientLogin(code);
        assert.equal('spazani', client.username);
    });

    it("should be able to suggest a product for an area", async function() {

        const code = await spazasSuggest.registerClient('spazani');
        const client = await spazasSuggest.clientLogin(code);

        const areas = await spazasSuggest.areas();
        const area = areas[2];

        await spazasSuggest.suggestProduct(area.id, client.id, 'Small Pizzas');

        const suggestions = await spazasSuggest.suggestionsForArea(area.id);

        assert.equal('Small Pizzas', suggestions[0].product_name)

    });

    it("should be able to get all the suggestions for an area", async function() {

        const code = await spazasSuggest.registerClient('spazani');
        const client = await spazasSuggest.clientLogin(code);

        const area1 = await spazasSuggest.findAreaByName('Nyanga');
        const area2 = await spazasSuggest.findAreaByName('Nyanga East');

        await spazasSuggest.suggestProduct(area1.id, client.id, 'Small Pizzas');
        await spazasSuggest.suggestProduct(area2.id, client.id, 'Small Pizzas');
        await spazasSuggest.suggestProduct(area1.id, client.id, 'Baked Beans');

        const suggestions = await spazasSuggest.suggestionsForArea(area1.id);

        assert.equal(2, suggestions.length);
        assert.equal('Small Pizzas', suggestions[0].product_name);
        assert.equal('Baked Beans', suggestions[1].product_name);

    });


    it("should be able to get all the suggestions made by a client", async function() {

        const code = await spazasSuggest.registerClient('spazani');
        const client = await spazasSuggest.clientLogin(code);

        const area1 = await spazasSuggest.findAreaByName('Nyanga');
        const area2 = await spazasSuggest.findAreaByName('Nyanga East');

        await spazasSuggest.suggestProduct(area1.id, client.id, 'Small Pizzas');
        await spazasSuggest.suggestProduct(area2.id, client.id, 'Small Pizzas');
        await spazasSuggest.suggestProduct(area1.id, client.id, 'Baked Beans');

        const suggestions = await spazasSuggest.suggestions(client.id);

        assert.equal(3, suggestions.length);
        assert.equal('Nyanga East', suggestions[1].area_name);

    });

    it("should be able to create a new Spaza shop", async function(){
        const area = await spazasSuggest.findAreaByName('Nyanga');
        const code = await spazasSuggest.registerSpaza('Spaza 101', area.id);
        assert.ok(code);
    });

    it("should be able to find a spaza shop using a code", async function(){

        const area = await spazasSuggest.findAreaByName('Nyanga')
        const code = await spazasSuggest.registerSpaza('Spaza 101', area.id);
        const spaza = await spazasSuggest.spazaLogin(code);
        assert.equal('Spaza 101', spaza.shop_name);
    });

    it("should be able to accept a suggestion", async function(){

        const code = await spazasSuggest.registerClient('spazani');
        const client = await spazasSuggest.clientLogin(code);

        const area1 = await spazasSuggest.findAreaByName('Nyanga');
        const area2 = await spazasSuggest.findAreaByName('Nyanga East');

        await spazasSuggest.suggestProduct(area1.id, client.id, 'Small Pizzas');
        await spazasSuggest.suggestProduct(area2.id, client.id, 'Small Pizzas');
        await spazasSuggest.suggestProduct(area1.id, client.id, 'Baked Beans');

        const spazaCode = await spazasSuggest.registerSpaza('Spaza 101', area1.id);
        const spaza = await spazasSuggest.spazaLogin(spazaCode);
        assert.equal('Spaza 101', spaza.shop_name);

        const suggestions = await spazasSuggest.suggestionsForArea(area1.id);

        await spazasSuggest.acceptSuggestion(suggestions[0].id, spaza.id);
        await spazasSuggest.acceptSuggestion(suggestions[0].id, spaza.id);
        
        const acceptedBySpaza = await spazasSuggest.acceptedSuggestions(spaza.id);

        assert.equal(1, acceptedBySpaza.length);

        assert.equal('Small Pizzas', acceptedBySpaza[0].product_name);

    });

    after(function () {
        db.$pool.end()
    });
   
});