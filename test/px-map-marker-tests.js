document.addEventListener("WebComponentsReady", function() {
  runCustomTests();
});

function runCustomTests() {

  describe('PxMapBehavior.Marker base', function() {
    var markerEl;
    var logFn;

    before(function() {
      // Create a stub for the Marker base behavior
      Polymer({
        is: 'px-map-marker-behavior-stub',
        behaviors: [PxMapBehavior.Marker]
      });

      Polymer({
        is: 'px-map-layer-parent-behavior-stub',
        behaviors: [PxMapBehavior.Element, PxMapBehavior.ParentLayer]
      });
    });

    beforeEach(function () {
      markerEl = fixture('MarkerBehaviorFixture');
      sandbox = sinon.sandbox.create();
      logFn = sandbox.stub(window.console, "log");
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('validates whether a given input is a number', function () {
      expect(markerEl._canBeNum(5)).to.be.true;
      expect(markerEl._canBeNum(0)).to.be.true;
      expect(markerEl._canBeNum("5")).to.be.true;
      expect(markerEl._canBeNum("abc")).to.be.false;
      expect(markerEl._canBeNum(NaN)).to.be.false;
      expect(markerEl._canBeNum("")).to.be.false;
    });

    it('validates whether given lat and lng values are valid', function () {
      expect(markerEl.latLngIsValid(10,20)).to.be.true;
      expect(markerEl.latLngIsValid("10","20")).to.be.true;
      expect(markerEl.latLngIsValid("abc10","20")).to.be.false;
      expect(markerEl.latLngIsValid(10,"")).to.be.false;
      expect(markerEl.latLngIsValid("","")).to.be.false;
    });

    it('outputs a console log statement if the lat or lng is invalid', function() {
      var invalidLatLng = markerEl.latLngIsValid("abc", 123);

      expect(logFn).to.have.been.calledWithExactly(`PX-MAP CONFIGURATION ERROR:
        You entered an invalid \`lat\` or \`lng\` attribute for ${markerEl.is}. You must pass a valid number.`);
    });

    it('does not draw a marker if either the lat or lng value is invalid', function() {
      var invalidFixtureStub = fixture('InvalidLatLngMarkerFixture');
      var invalidLatLngMarkerEl = invalidFixtureStub.querySelector('px-map-marker-behavior-stub');

      expect(invalidLatLngMarkerEl.canAddInst()).to.be.false;
    });

    it ('hides a marker if its previously valid lat/lng becomes invalid, and then shows it if the lat/lng becomes valid again', function(done) {
      var validFixtureStub = fixture('ValidLatLngMarkerFixture');
      var validMarkerEl = validFixtureStub.querySelector('px-map-marker-behavior-stub');
      validMarkerEl.getMarkerIcon = function() {
        return L.divIcon();
      };

      var setOpacityFn;

      setTimeout(function() {
        expect(validMarkerEl.elementInst._map).to.be.an.instanceof(L.Map);
        setOpacityFn = sinon.spy(validMarkerEl.elementInst, 'setOpacity');
        validMarkerEl.setAttribute("lat", "abc");
      }, 400);

      setTimeout(function() {
        expect(setOpacityFn).to.have.been.calledOnce;
        expect(setOpacityFn).to.have.been.calledWithExactly(0);
        validMarkerEl.setAttribute("lat", "12");
      }, 600);

      setTimeout(function() {
        expect(setOpacityFn).to.have.been.calledTwice;
        expect(setOpacityFn).to.have.been.calledWithExactly(1);
        done();
      }, 800);
    });

});

describe('px-map-marker-locate', function () {
  var locateMarkerFixture;
  var markerEl;
  var markerOptions;
  var sandbox;

  beforeEach(function () {
    locateMarkerFixture = fixture('LocateMarkerWithNameFixture');
    markerEl = locateMarkerFixture.querySelector('px-map-marker-locate');
    markerOptions = markerEl.getInstOptions();
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('returns title property as configured through the `name` attribute (from `getInstOptions`)', function() {
    expect(markerOptions.baseConfig).to.be.an('object');
    expect(markerOptions.baseConfig).to.have.property('title').that.equals('i am a locate marker');
  });

  it('asks to update its title option when the `name` attribute is changed (with `shouldUpdateInst` observer)', function() {
    var updateFn = sinon.spy(markerEl, 'shouldUpdateInst');
    markerEl.set('name', 'A new name');

    expect(updateFn).to.have.been.calledOnce;
  });

  it('updates title property when changed through the `name` attribute', function(done) {
    markerEl.setAttribute('name', 'A new name');
    flush(function() {
      expect(markerEl.getInstOptions().baseConfig).to.have.property('title').that.equals('A new name');
      done();
    });
  });

  it('puts the title tag into the path', function(done) {
    flush(function() {
      var markerInstance = markerEl.elementInst;
      var layer;
      var keys = Object.keys(markerInstance._layers);
      for (var i=0; i<keys.length; i++) {
        if (markerInstance._layers[keys[i]].options.title) {
          layer = markerInstance._layers[keys[i]];
        }
      }
      expect(layer.options.title).to.equal("i am a locate marker");
      var regex = /<title.*i am a locate marker<\/title>/
      expect(regex.test(layer._path.innerHTML)).to.equal(true);
      done();
    });
  });

});

}
