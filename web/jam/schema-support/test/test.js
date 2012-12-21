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

var basicStringField = {
   "labels": {
      "tiny": {
        "en": "ID"
      },
      "description": {
         "en": "Reporting Unit ID"
      },
      "short": {
         "en": "Unit ID"
      }
   },
   "type": "string"
};

var listField = {
      "type": "integer",
      "labels": {
         "short": {
            "en": "Place of Delivery"
         }
      },
      "list": [
         [
            1,
            {
               "en": "Home",
               "ne": "घर"
            }
         ],
         [
            2,
            {
               "en": "Health Facility",
               "ne": "स्वास्थ्य संस्था"
            }
         ],
         [
            3,
            {
               "en": "Other Place",
               "ne": "अन्य ठाउँ"
            }
         ]
      ]
};


// super lazy clone
function cheapClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}


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


describe('Properties', function() {
    describe('String', function() {
        it("should handle a basic string property", function() {
            var form = cheapClone(basicForm);
            form[0].fields = {
                id : cheapClone(basicStringField)
            };
            var tl = translator(form, 'en');
            assert.ok(tl.VPD.schema.properties);
            assert.ok(tl.VPD.schema.properties.id);
            assert.equal(tl.VPD.schema.properties.id.type, 'string');
            assert.equal(tl.VPD.schema.properties.id.title, 'Unit ID');
        })

        it('should handle min,max settings', function() {
            var form = cheapClone(basicForm);
            var id = cheapClone(basicStringField);
            id.length = [1, 2]
            form[0].fields = {
                id : id
            };
            var tl = translator(form, 'en');
            assert.equal(tl.VPD.schema.properties.id.minLength, 1);
            assert.equal(tl.VPD.schema.properties.id.maxLength, 2);
        })

        it('should handle required fields', function() {
            var form = cheapClone(basicForm);
            var id = cheapClone(basicStringField);
            id.required = true;
            form[0].fields = {
                id : id
            };
            var tl = translator(form, 'en');
            assert.ok(tl.VPD.schema.properties.id.required);
        })

        it('should handle number only string fields', function() {
            var form = cheapClone(basicForm);
            var id = cheapClone(basicStringField);
            id.flags = {
                input_digits_only : true
            };
            form[0].fields = {
                id : id
            };
            var tl = translator(form, 'en');
            assert.equal(tl.VPD.schema.properties.id.pattern, '[0-9]+');
        })
    })
})

describe('Lists', function(){
    it('should convert a list to an enum with jehint', function(){
        var form = cheapClone(basicForm);
        form[0].fields = {
            place : cheapClone(listField)
        };
        var tl = translator(form, 'en');
        var conveted_prop = tl.VPD.schema.properties.place;
        assert.equal(conveted_prop['je:hint'], 'enumlabels');
        assert.equal(conveted_prop['je:enumlabels'][1], 'Home');
        assert.equal(conveted_prop['je:enumlabels'][2], 'Health Facility');
        assert.equal(conveted_prop['je:enumlabels'][3], 'Other Place');
        assert.equal(conveted_prop.enum.length,3 );
        assert.deepEqual(conveted_prop.enum, [1,2,3] );
    })
})


describe('Post Save', function() {
    describe('form type', function() {

        it('should add the doc.form from the meta.code', function(done) {
            var tl = translator(basicForm);
            var doc = {};
            tl.VPD.post_save(doc, function(err, doc) {
                assert.equal(doc.form, 'VPD');
                done();
            })
        })


    })
})