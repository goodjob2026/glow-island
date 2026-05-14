System.register([], function (_export, _context) {
  "use strict";

  var cc, Application;
  function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
  function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
  function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
  function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
  function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
  return {
    setters: [],
    execute: function () {
      _export("Application", Application = /*#__PURE__*/function () {
        function Application() {
          _classCallCheck(this, Application);
          this.settingsPath = 'src/settings.json';
          this.showFPS = false;
        }
        _createClass(Application, [{
          key: "init",
          value: function init(engine) {
            cc = engine;
            cc.game.onPostBaseInitDelegate.add(this.onPostInitBase.bind(this));
            cc.game.onPostSubsystemInitDelegate.add(this.onPostSystemInit.bind(this));
          }
        }, {
          key: "onPostInitBase",
          value: function onPostInitBase() {
            // no-op
          }
        }, {
          key: "onPostSystemInit",
          value: function onPostSystemInit() {
            // After scene launch, spawn PrototypeBoard if Canvas has no Board child
            cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
              try {
                var scene = cc.director.getScene();
                if (!scene) return;
                var canvas = scene.getChildByName('Canvas');
                if (!canvas) return;
                if (canvas.getChildByName('Board')) return; // already present
                var PB = cc.js.getClassByName('PrototypeBoard');
                if (!PB) { console.warn('[app] PrototypeBoard class not found'); return; }
                var board = new cc.Node('Board');
                var uit = board.addComponent(cc.UITransform);
                uit.setContentSize(528, 528);
                board.addComponent(PB);
                canvas.addChild(board);
                console.log('[app] PrototypeBoard spawned on', scene.name);
              } catch (e) {
                console.error('[app] spawn error', e);
              }
            });
          }
        }, {
          key: "start",
          value: function start() {
            return cc.game.init({
              debugMode: cc.DebugMode.ERROR,
              settingsPath: this.settingsPath,
              overrideSettings: {
                profiling: { showFPS: this.showFPS }
              }
            }).then(function () {
              return cc.game.run();
            });
          }
        }]);
        return Application;
      }());
    }
  };
});
