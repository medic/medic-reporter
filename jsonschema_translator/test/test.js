var assert = require("assert")
    translator = require('../translator')

describe('Basic', function () {
    describe('no data', function () {

        it('should return empty schema when null is provided', function () {
            assert.deepEqual(translator(null), {});
        })

        it('should return empty schema when [] is provided', function () {
            assert.deepEqual(translator([]), {});
        })

    })
})

var basicForm = [{
    meta: {
      code: "VPD",
      label: {
         en: "CDC Weekly Report",
         fr: "Alerte référence"
      }
    }
}];



describe('Meta', function() {
    describe('code', function() {
        it('should set the result key and schema name to meta.code', function() {
            var tl = translator(basicForm);
            assert.ok(tl.VPD);
            assert.equal(tl.VPD.key, 'VPD');
            assert.equal(tl.VPD.schema.name, 'VPD');
        })
    })


    describe('label', function() {
        it('should set the description on the schema if available', function() {
           var tl = translator(basicForm);
           assert.equal(tl.VPD.schema.description, basicForm[0].meta.label.en);
        })
        it('should set the description on the schema if available, correct lang', function() {
            var tl = translator(basicForm, 'fr');
            assert.equal(tl.VPD.schema.description, basicForm[0].meta.label.fr);
        })
        it('should fallback to english if not available', function() {
            var tl = translator(basicForm, 'es');
            assert.equal(tl.VPD.schema.description, basicForm[0].meta.label.en);
        })
    });
})



describe('Post Save', function() {
    describe('form type', function() {

        it('should add the doc.form from the meta.code', function() {
            var tl = translator(basicForm);
            var doc = {};
            tl.VPD.post_save(doc, function(err, doc) {
                assert.equal(doc.form, 'VPD');
            })
        })


    })
})