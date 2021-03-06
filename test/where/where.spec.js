// jasmine-based where.spec.js

if (typeof require == 'function') {
  // enable to re-use in a browser without require.js
  require('../../where.js');
  require('../../strategy/jasmine-strategy.js');
}

describe('where.js [core jasmine spec]', function () {

   /* CHARACTERIZATION TESTS */

  describe('API', function () {
      
    it('should be global', function() {
      expect(typeof where).toBe('function');
    });
      
    it('should accept 2 arguments', function () {
      expect(where.length).toBe(2);
    });
       
    it('should accept only a function as first argument', function () {
      expect(function () {
        where(!function(){});
       }).toThrow();
    });
    
    it('should ignore line comments', function () {
      expect(function () {
        where(function(){
          /***
            | a | b | c |
            | 1 | 2 | 2 | // should pass
          //| 4 | 3 | x | (should not execute)
          ***/
          expect(Math.max(a, b)).toBe(c);
        });
       }).not.toThrow();
    });
    
    it('should throw when all data rows are line-commented', function () {
      expect(function () {
        where(function(){
          /*** 
              a  |  b  |  c
          //  1  |  2  |  2 // should fail
          ***/
          expect(Math.max(a, b)).toBe(Number(c));
        });
       }).toThrow();
    });

    it('should not throw if missing expectation', function () {
      expect(function () {
        where(function(){
          /*** 
            a  |  b  |  c
            1  |  2  |  2
            4  |  3  |  4
            6  |  6  |  6
            ***/
        });
       }).not.toThrow();
    });
    
    it('should pass with correct data and expectation', function () {
      where(function(){
        /*** 
          a  |  b  |  c
          1  |  2  |  2
          4  |  3  |  4
          6  |  6  |  6
          ***/
        expect(Math.max(a, b)).toBe(Number(c));
      });
    });
    
    it('should pass with left and right table borders', function () {
      where(function(){
        /*** 
          | d | e | f |
          | 1 | 2 | 2 |
          | 4 | 3 | 4 |
          | 6 | 6 | 6 |
          ***/
        expect(Math.max(d, e)).toBe(f);
      });
    });
    
    it('should return results', function () {
      var results = where(function(){
        /*** 
          a  |  b  |  c
          6  |  6  |  6
        ***/
        expect(Math.max(a, b)).toBe(Number(c));
      });
      
      expect(results.passing.length).toBe(1);
      expect(results.data.values.length).toBe(1);
      expect(results.data.labels.join(',')).toBe("a,b,c");
    });
    
    it('should ignore empty rows', function () {
      var results = where(function(){
        /*** 
          a  |  b  |  c

          6  |  6  |  6
          ***/
        expect(Math.max(a, b)).toBe(Number(c));
      });
      
      expect(results.data.values.length).toBe(1);
    });
    
    it('should pass with data containing various padding', function () {
      expect(function () {
        where(function(){
          /*** 
              a | b|c
               6|4 |10
            ***/
          
         // /* I DETECT A USABILITY ISSUE WITH Number() for every input      */
          expect(Number(a) + Number(b)).toBe(Number(c))
        });
      }).not.toThrow();
    });
    
    it('should convert numeric data automatically', function () {
      expect(function () {
        where(function(){
          /***
            a        | b      | c       | p
                
            0        | 1      | 1       | 1
            0.0      | 1.0    | 1       | 1
            -1       | +1     | 0       | 1
            +1.1     | -1.2   | -0.1    | 2
            08       | 08     | 16      | 2
            6        | 4      | 10.0    | 3
            8.030    | -2.045 | 5.985   | 4
            1,000.67 | 1345   | 2345.67 | 6
            5        | 5      | 10      | 1
            ***/
          
          /*
           * using precision for famous .1 + .2 == 0.30000000000000004 
           * and 5.985 vs 5.98499999999999999999999999 bugs 
           */
   
          var s = (a + b).toPrecision(p);
          
          /*
           * toPrecision() returns a string, so the prefixed '+' uses implicit 
           * conversion to number.
           */
           
          expect(+s).toBe(c);
        });
        
       }).not.toThrow();
    });

    it('should convert null, undefined, booleans automatically', function () {
      where(function () {
        /***
          a    | b         | c     | d
          null | undefined | false | true
          ***/
        expect(a).toBe(null);
        expect(b).toBe(undefined);
        expect(c).toBe(false);
        expect(d).toBe(true);        
      });
    });
    
    it('should handle quoted strings', function () {
      where(function () {
        /***
          a  | b  | c    | d    | e   | f        | g           | h | normal 
          '' | "" | "''" | '""' | ' ' | ' faff ' | 'undefined' |   |   a b   
          ***/
        expect(a).toBe('\'\'');
        expect(b).toBe('\"\"');
        expect(c).toBe('\"\'\'\"');
        expect(d).toBe('\'"\"\'');
        expect(e).toBe('\' \'');
        expect(f).toBe('\' faff \'');
        expect(g).toBe('\'undefined\'');
        expect(h).toBe('');         // empty boxes are empty strings
        expect(normal).toBe('a b'); // unquoted values are strings
      });
    });
    
    it('should handle numeric strings', function() {
      where(function () {
        /***
          date        | dataString   | number | numberString
          1973-01-01  | '2014-01-01' | 2      | '4'
          ***/
        expect(date).toBe('1973-01-01');
        expect(dataString).toBe('\'2014-01-01\'');
        expect(number).toBe(2);
        expect(numberString).toBe('\'4\'');
      });
    });

    
  // Merge pull request #4 from johann-sonntagbauer
    it('should not strip "/"', function() {
      where(function() {
        /***
            date
            01/01/1970   // comment
         // 02/02/1972
         ***/
        expect(typeof date).toBe('string');
        expect(date).toBe('01/01/1970');
      });
    });
    
    
    // 13 MAR 2104
    // strict mode test (ES5) with fallback error check to prevent global leaks
    // see http://caniuse.com/use-strict
    it('should throw "use strict" error for undeclared vars', function () {
      expect(function() {
        where(function() {
          /***
            error
            'undeclared variable should be caught by strict mode'
          ***/
          accidental = error;
          // this will throw only if strict mode is not enabled/supported.
          throw new Error(error);
        })
      }).toThrow();
    });
    
  });

 
  /* empty vs. bordered data */

  describe('empty vs. bordered data', function() {
  
    it('should throw when empty data missing separators', function() {
      expect(function() {
        where(function() {
          /***
           a 
              // interpreted as missing row, not as row with empty data
          ***/
          expect(a).toBe('');
        });
      }).toThrow();
    });
    
    it('should not throw when empty data is separated', function() {
      where(function() {
        /***
        | a |
        |   | // interpreted as row with empty data
        ***/
        expect(a).toBe('');
      });
    });
    
    it('should throw when missing last value', function () {
      expect(function () {
        where(function(){
        /*** 
          a  |  b  |  c
          1  |  2  |
        ***/});
      }).toThrow();
    });
    
    it('should not throw when empty last value is bordered', function () {
      expect(function () {
        where(function(){
        /*** 
        |  a  |  b  |  c |
        |  1  |  2  |    |
        ***/});
      }).not.toThrow();
    });
    
    it('should throw when missing first value', function () {
      expect(function () {
        where(function(){
        /*** 
          a  |  b  |  c
             |  1  |  2
        ***/});
      }).toThrow();
    });
    
    it('should not throw when empty first value is bordered', function () {
      expect(function () {
        where(function(){
        /*** 
        |  a  |  b  |  c |
        |     |  1  |  2|
        ***/});
      }).not.toThrow();
    });
    
    it('should not throw when missing inner value', function () {
      expect(function () {
        where(function(){
        /*** 
          a  |  b  |  c
          1  |     | 2
        ***/});
      }).not.toThrow();
    });
    
  });

  /* MALFORMED TABLE */
  
  describe('malformed data table', function () {

    it('should throw when function has no data-table comment', function () {
      expect(function () {
        where(function(){});
       }).toThrow();
    });
    
    it('should throw when function has no data-table rows', function () {
      expect(function () {
        where(function(){
        /***
        ***/});
       }).toThrow();
    });
    
    it('should throw when table contains only one row', function () {
      expect(function () {
        where(function(){
        /*** 
          a  |  b  |  c 
        ***/});
       }).toThrow();
    });

    it('should throw when table contains duplicate labels', function () {
      expect(function () {
        where(function(){
        /***
          a | a
          0 | 1
          ***/
        });
      }).toThrow();
    });
         
    it('should throw when table data not properly separated', function () {
      expect(function () {
        where(function(){
        /*** 
          a  |  b  |  c
          6     4     0
        ***/});
       }).toThrow();
    });
    
    it('should throw when table borders are not balanced', function() {
      expect(function () {
        where(function(){
          /*** 
            | a | b | c 
            | t | o | to
          ***/
          expect(a + b).toBe(c);
        });
      }).toThrow();
    });    
  });

  
  // STRATEGY API 
  
  describe('strategy API', function () {
  
    it('should accept context arg with jasmine and expect props', function () {
      where(function(){
        /*** 
          a  |  b  |  c
          1  |  2  |  3
          ***/
        expect(jasmine).toBe(context.jasmine);
        expect(expect).toBe(context.expect);

      }, { jasmine: jasmine, expect: expect });
    });
    
    it('should accept context arg with {strategy: "jasmine"}', function () {
      
      where(function(){
        /*** 
          a  |  b  |  c
          1  |  2  |  3
          ***/
        expect(strategy).toBe('jasmine');
        
      }, { strategy: 'jasmine', jasmine: jasmine, expect: expect });
    });
    
    it('should retrieve registered strategies', function() {
      // self-test
      where(function() {
        /***
         name
         mocha
         jasmine
         ***/
         expect(where.strategy.registry[name]).toBeDefined();
      }, { jasmine: jasmine, expect: expect });
    });
    
    it('should list all registered strategies', function () {
    
      var list = where.strategy.list();
      expect(list.length).toBe(2);
    });
    
    it('should add a strategy', function() {
      var name = 'fake';
      var fn = function() {};
      
      where.strategy(name, fn);
      expect(where.strategy.registry[name]).toBe(fn);
      expect(where.strategy.list().length).toBe(3);      
    });
    
    it('should delete a strategy', function () {
      var name = 'fake';
      
      delete where.strategy.registry[name]
      expect(where.strategy.registry[name]).not.toBeDefined();
      expect(where.strategy.list().length).toBe(2);      
    });
    
    it('should restore a deleted strategy', function () {
      var name = 'jasmine';
      var fn = where.strategy.registry[name];
      var length = where.strategy.list().length;      

      delete where.strategy.registry[name];
      
      // self-test
      where(function () {
        /***
          name
          jasmine
         ***/
        expect(where.strategy.registry[name]).not.toBeDefined();
        expect(where.strategy.list().length).toBe(length - 1);      
        
      }, { jasmine: jasmine, expect: expect, fn: fn, length: length });
      
      // restore it
      where.strategy(name, fn);
      
      // self-test
      where(function () {
        /***
          name
          jasmine
         ***/
        expect(where.strategy.registry[name]).toBe(fn);
        expect(where.strategy.list().length).toBe(length);      
        
      }, { jasmine: jasmine, expect: expect, fn: fn, length: length });
    });
  });
  
  
  /***
   * INTERCEPT & LOG TESTS
   * Use these tests to intercept results set by jasmine, particularly on specs
   * that fail.
   ***/

  describe('using strategy for intercept and log', function () {

    it('specify jasmine strategy in context', function () {

      var results = where(function(){
        /*** 
          a  |  b  |  c
          1  |  1  |  1
        ***/
        
        expect(jasmine).toBe(context.jasmine);
        
      }, { jasmine: jasmine, expect: expect });
      
      expect(results.failing.length).toBe(0);
      expect(results.passing.length).toBe(1);
    });
    
    it('should not throw on error when intercept specified', function () {

      var results = where(function(){
        /*** 
          a  |  b  |  c
          1  |  1  |  x
        ***/
        expect(Math.max(a, b)).toBe(c);
        
      }, { jasmine: jasmine, expect: expect, intercept: 1});
      
      expect(results.failing.length).toBe(1);
    });
    
    it('should log all results when specified', function () {
    
      // stub out console.log - then restore it afterward
      var log = console.log;
      
      var count = 0;
      
      console.log = function () {
        count += 1;
      }
      
      var results = where(function(){
        /*** 
          a  |  b  |  c
          1  |  1  |  1
          1  |  2  |  2
          4  |  2  |  4
          4  |  8  |  7
        ***/
        expect(Math.max(a, b)).toBe(Number(c));
        
      }, { jasmine: jasmine, expect: expect, intercept: 1, log: 1});
      
      expect(count).toBe(results.passing.length + results.failing.length);
      
      // RESTORE console.log
      console.log = log;      
    });  
    
    it('should return results for incorrect expectation', function () {
    
      var results = where(function(){
        /*** 
          a  |  b  |  c
          1  |  1  |  1
          1  |  2  |  2
          4  |  2  |  4
          4  |  8  |  7
        ***/
        expect(Math.max(a, b)).toBe(c);
      }, { jasmine: jasmine, expect: expect, intercept: 1 });
            
      expect(results.failing.length).toBe(1);
      expect(results.passing.length).toBe(3);
      expect(results.failing[0].message).toContain("[a | b | c]");
      expect(results.failing[0].message).toContain("[4 | 8 | 7]");
      expect(results.failing[0].message).toContain("Expected 8 to be 7.");
    });

    it('should return results for incorrect matches or values', function () {
    
      var results = where(function(){
        /*** 
          a  |  b  |  c
          1  |  1  |  1
          1  |  2  |  x
          3  |  2  |  3
          5  |  3  |  5.01
        ***/
        
        // /* using match for numeric data here */        
        expect(Math.max(a, b)).toBe(c);
        
      }, { jasmine: jasmine, expect: expect, intercept: 1 });

      expect(results.failing.length).toBe(2);
      expect(results.passing.length).toBe(2);
      expect(results.failing[0].message).toContain("Expected 2 to be '" + 
                                                   results.data.values[1][2] + 
                                                   "'.");
      expect(results.failing[1].message).toContain("Expected 5 to be 5.01.");
    }); 

  // issue 8 - error reporting format (tables not well-formed)
  // requested enhancement from johan sonntagbauer  
  // https://github.com/dfkaye/where.js/issues/8
  
    it('should return well-formatted messages', function () {
    
      var results = where(function () {
        /*** 
          leftInput |    b  |  andTheAnswerIs
            1000    |  1000 |  1000
             12     |    24 |  24
          451       |  2    |  4451
          4         |  8    |  7
        ***/
        
        expect(Math.max(leftInput, b)).toBe(andTheAnswerIs);
        expect(b).not.toBe(2);
        
        }, { jasmine: jasmine, expect: expect, intercept: 1, log: 1 });
      
      var passing = results.passing[0].message.split('\n');
      
      expect(passing.length).toBe(4);
      expect(passing[0]).toBe('');
      expect(passing[1]).toBe(' [leftInput | b    | andTheAnswerIs] : ');
      expect(passing[2]).toBe(' [1000      | 1000 | 1000          ] (Passed) ');
      expect(passing[3]).toBe('');
      
      var failing = results.failing[0].message.split('\n');
      
      expect(failing[0]).toBe('');
      expect(failing[1]).toBe(' [leftInput | b    | andTheAnswerIs] : ');
      
      // jasmine 1 inserts "Error: " in message, but jasmine 2 does not.
      // so verify row format and that the message is produced
      expect(failing[2]).toContain(' [451       | 2    | 4451          ]');
      
      // verify first expectation failure message
      expect(failing[2]).toContain('Expected 451 to be 4451.');
      // verify the second expectation is appended 
      expect(failing[2]).toContain('Expected 2 not to be 2.');
      expect(failing[3]).toBe('');
    });
  });

  
  // COMPILED FROM COFFEESCRIPT
  
  describe('CoffeeScript compiled to JavaScript', function () {
    
  // submitted by jason karns
  // https://github.com/dfkaye/where.js/issues/6
  // support more aesthetic coffeescript multiline string syntax
  
    it('should handle compiled multiline CoffeeScript', function () {
    
      /* 
       * where ->
       *   """
       *   a | b | c
       *   1 | 2 | 3
       *   4 | 5 | 9
       *   """
       *   expect(a + b).toBe(c)
       */
    
      where(function() {
      
        "a | b | c\n1 | 2 | 3\n4 | 5 | 9";
        
        return expect(a + b).toBe(c);
      });
      
    });
    
    it('should intercept expected fails in compiled CoffeeScript', function () {
    
      /*
       * results = where ->
       *   """
       *   a | b | c
       *   1 | 2 | 3
       *   4 | 5 | 6
       *   """
       *   expect(a + b).toBe(c)
       *         
       * , { jasmine: jasmine, expect: expect, intercept: 1 }
       *
       * expect(results.failing.length).toBe(1)
       * expect(results.passing.length).toBe(1)
       */
       
      var results;

      results = where(function() {
        "a | b | c\n1 | 2 | 3\n4 | 5 | 6";
        return expect(a + b).toBe(c);
      }, {
        jasmine: jasmine,
        expect: expect,
        intercept: 1
      });

      expect(results.failing.length).toBe(1);

      expect(results.passing.length).toBe(1);
      
    });
    
    it('should remove line comments within compiled CoffeeScript', function () {
    
      /* 
       * where ->
       *   """
       *   a | b | c
       * # 1 | 2 | 3 # should be removed
       *   4 | 5 | 9
       *   """
       *   expect(a + b).toBe(c)
       */
    
      where(function() {
      
        "a | b | c\n# 1 | 2 | 3 # should be removed\n4 | 5 | 9";
        
        return expect(a + b).toBe(c);
      });
      
    });
    
  });
  
  
  // ASYNCHRONOUS TESTS IN JASMINE
  
  describe('asynchronous tests', function () {
  
    it('should throw when missing separator in data-table', function (done) {
    
      setTimeout(function () {
      
        expect(function () {
          where(function(){
            /*** 
              a  |  b  |  c
              6     4  |  0
            ***/});
         }).toThrow();
         
         done();
         
      }, 500);
      
    });
    
    it('should work with intercept', function (done) {

      setTimeout(function () {
      
        var results = where(function(){
          /*** 
            a  |  b  |  c
            1  |  1  |  1
            1  |  2  |  2
            4  |  2  |  4
            4  |  8  |  7
          ***/
          expect(Math.max(a, b)).toBe(Number(c));
        }, { jasmine: jasmine, expect: expect, intercept: 1});
        
        expect(results.failing.length).toBe(1);
        expect(results.passing.length).toBe(3);
        expect(results.failing[0].message).toContain("Expected 8 to be 7.");
        
        done();
        
      }, 500);
    });
    
    it('should log all results', function (done) {

      setTimeout(function () {
      
        var results = where(function(){
          /*** 
            a  |  b  |  c
            1  |  1  |  1
            1  |  2  |  2
            4  |  2  |  4
            4  |  8  |  7
          ***/
          expect(Math.max(a, b)).toBe(Number(c));
        }, { jasmine: jasmine, expect: expect, intercept: 1, log: 1});
        
        expect(results.failing.length).toBe(1);
        expect(results.passing.length).toBe(3);
        expect(results.failing[0].message).toContain("[a | b | c]");
        expect(results.failing[0].message).toContain("[4 | 8 | 7]");
        expect(results.failing[0].message).toContain("Expected 8 to be 7.");
        
        done();
        
      }, 500);
    });
    
  });
  
  /***
   * Use these tests to see displayed stack traces and results messages for 
   * failed specs.
   ***/
  describe('non-intercepted failing tests', function () {

    it("should generate stack trace with 'should contain at least 2 rows but has 0'", function () {
      
      // stub out console.log - then restore it afterwards.
      var log = console.log;
      
      var last;
      var results;

      console.log = function (msg) {
        last = msg;
      }
      try {
        results = where(function(){
          /***
          ***/
        });
      } catch(error) {
        last = error.message;
        console.log = log;
      }
      
      expect(last).toContain('should contain at least 2 rows but has 0');
      expect(results).toBeUndefined();
    });
    
  });

  describe('object tests', function () {
  
    // contributed via issues by @jamonholmgren 4 FEB 2014
    it('should instantiate objects with correct keys', function () {
    
      where(function () {
        /***
          a | b | c
          1 | 2 | 3
          6 | 12 | 18
        ***/
        
        var obj = new Obj(a,b,c); // DIY instantiation
        expect(obj.a + obj.b).toEqual(obj.c);

        // quick array test
        expect([a,b,c].reverse()).toEqual([c,b,a]);
        
      }, { Obj: function (a,b,c) { this.a = a; this.b = b; this.c = c;} });
      
    });
  });
  
});