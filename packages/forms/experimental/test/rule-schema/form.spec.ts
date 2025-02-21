import {signal} from '@angular/core';
import {z} from 'zod';
import {form} from '../../src/rule-schema/form';
import {disable, error, metadata, when} from '../../src/rule-schema/logic';
import {each, include, rule, schema} from '../../src/rule-schema/schema';

const nameSchema = schema<{first: string; last: string}>((root) => {
  rule(
    root.last,
    when((value) => !value(), error('Last name is required')),
  );
  rule(
    root,
    when(() => root.first.$() === '<Anonymous>', disable('User is anonymous')),
  );
});

const profileSchema = schema<{name: {first: string; last: string}}>((root) => {
  include(root.name, nameSchema);
});

describe('form', () => {
  describe('no schema', () => {
    it('should read data', () => {
      const f = form(signal({name: {first: 'John', last: 'Doe'}}));
      expect(f.$()).toEqual({name: {first: 'John', last: 'Doe'}});
      expect(f.name.$()).toEqual({first: 'John', last: 'Doe'});
      expect(f.name.first.$()).toBe('John');
      expect(f.name.last.$()).toBe('Doe');
    });

    it('should write data', () => {
      const f = form(signal({name: {first: 'John', last: 'Doe'}}));
      f.name.first.$.set('Jane');
      expect(f.$()).toEqual({name: {first: 'Jane', last: 'Doe'}});
    });

    it('should mark tocuhed', () => {
      const f = form(signal({name: {first: 'John', last: 'Doe'}}));
      expect(f.$.touched()).toBe(false);
      expect(f.name.first.$.touched()).toBe(false);
      f.name.first.$.markTouched();
      expect(f.$.touched()).toBe(true);
      expect(f.name.first.$.touched()).toBe(true);
    });

    it('should mark dirty', () => {
      const f = form(signal({name: {first: 'John', last: 'Doe'}}));
      expect(f.$.dirty()).toBe(false);
      expect(f.name.first.$.dirty()).toBe(false);
      f.name.first.$.markDirty();
      expect(f.$.dirty()).toBe(true);
      expect(f.name.first.$.dirty()).toBe(true);
    });
  });

  describe('with schema', () => {
    xit('should allow rule on field that does not exist', () => {
      const s = schema<number[]>((f) => {
        rule(f[38], disable());
      });
      const data = signal([]);
      const f = form(data, s);
      expect(f.$.disabled()).toBe(false);

      // {{ <input [field]="f[38]"> }}
      // @for (field of f) {...}
      expect(f.length).toBe(0);
      expect(f[38].$).toBe(undefined as any);
      data.set(Array.from({length: 100}));
      expect(f[38].$.disabled()).toBe(true);
    });

    it('should raise errors', () => {
      const f = form(signal({name: {first: 'John', last: 'Doe'}}), profileSchema);
      expect(f.$.errors()).toEqual([]);
      expect(f.name.$.errors()).toEqual([]);
      expect(f.name.first.$.errors()).toEqual([]);
      expect(f.name.last.$.errors()).toEqual([]);
      f.name.last.$.set('');
      expect(f.$.errors()).toEqual([]);
      expect(f.name.$.errors()).toEqual([]);
      expect(f.name.first.$.errors()).toEqual([]);
      expect(f.name.last.$.errors()).toEqual([{message: 'Last name is required', type: 'custom'}]);
    });

    it('should validate', () => {
      const f = form(signal({name: {first: 'John', last: 'Doe'}}), profileSchema);
      expect(f.$.valid()).toBe(true);
      expect(f.name.$.valid()).toBe(true);
      expect(f.name.first.$.valid()).toBe(true);
      expect(f.name.last.$.valid()).toBe(true);
      f.name.last.$.set('');
      expect(f.$.valid()).toBe(false);
      expect(f.name.$.valid()).toBe(false);
      expect(f.name.first.$.valid()).toBe(true);
      expect(f.name.last.$.valid()).toBe(false);
    });

    it('should disable', () => {
      const f = form(signal({name: {first: 'John', last: 'Doe'}}), profileSchema);
      expect(f.$.disabled()).toBe(false);
      expect(f.name.$.disabled()).toBe(false);
      expect(f.name.first.$.disabled()).toBe(false);
      expect(f.name.last.$.disabled()).toBe(false);
      f.name.first.$.set('<Anonymous>');
      expect(f.$.disabled()).toBe(false);
      expect(f.name.$.disabled()).toEqual({reason: 'User is anonymous'});
      expect(f.name.first.$.disabled()).toEqual({reason: 'User is anonymous'});
      expect(f.name.last.$.disabled()).toEqual({reason: 'User is anonymous'});
    });

    describe('should support logic on each property', () => {
      it('of an object', () => {
        const data = signal({x: 0, y: 0, z: 0});
        const f = form(
          data,
          schema((axes) => {
            each(axes, (axis) => {
              rule(
                axis,
                when((value) => value() < 0, error('value must be positive')),
              );
            });
          }),
        );
        expect(f.$.valid()).toBe(true);
        data.set({x: 0, y: -1, z: 0});
        expect(f.x.$.valid()).toBe(true);
        expect(f.y.$.valid()).toBe(false);
        expect(f.z.$.valid()).toBe(true);
      });

      it('of a record', () => {
        const data = signal<{[k: string]: unknown}>({});
        const f = form(
          data,
          schema((properties) => {
            each(properties, (property, name) => {
              rule(
                property,
                when(() => name === 'type', error('"type" is a reserved property')),
              );
            });
          }),
        );
        expect(f.$.valid()).toBe(true);
        data.set({wdith: 100, height: 100});
        expect(f.$.valid()).toBe(true);
        data.set({type: 'rectangle'});
        expect(f.$.valid()).toBe(false);
      });

      it('of an array', () => {
        const data = signal<number[]>([]);
        const f = form(
          data,
          schema((numbers) => {
            each(numbers, (num, idx) => {
              rule(
                num,
                when(
                  (value) => idx > 0 && value() < numbers.$()[idx - 1],
                  error('Must be monotonically increasing'),
                ),
              );
            });
          }),
        );
        expect(f.$.valid()).toBe(true);
        data.set([1, 2, 3, 0]);
        expect(f[0].$.valid()).toBe(true);
        expect(f[1].$.valid()).toBe(true);
        expect(f[2].$.valid()).toBe(true);
        expect(f[3].$.valid()).toBe(false);
        data.set([1]);
        expect(f[0].$.valid()).toBe(true);
      });

      it('of a tuple', () => {
        const data = signal([0, 0, 0]);
        const f = form(
          data,
          schema((dimensions) => {
            each(dimensions, (dimension) => {
              rule(
                dimension,
                when((value) => value() < 0, error('Must have a positive value')),
              );
            });
          }),
        );
        expect(f.$.valid()).toBe(true);
        f[1].$.set(-1);
        expect(f[0].$.valid()).toBe(true);
        expect(f[1].$.valid()).toBe(false);
        expect(f[2].$.valid()).toBe(true);
      });
    });

    it('should correctly order rule and each', () => {
      const s = schema<{x: number; y: number}>((coord) => {
        rule(coord.x, disable());
        each(coord, (axis) => {
          rule(axis, disable(false));
        });
        rule(coord.y, disable());
      });
      const f = form(signal({x: 0, y: 0}), s);
      expect(f.x.$.disabled()).toBe(false);
      expect(f.y.$.disabled()).toBe(true);
    });

    it('should update index-based calculation when item is inserted', () => {
      const s = schema<number[]>((numbers) => {
        each(numbers, (num, idx) => {
          rule(
            num,
            when(() => idx % 2 === 0 && num.$() % 2 === 0, disable()),
          );
        });
      });
      const data = signal<number[]>([0, 1, 2, 3, 4, 5]);
      const f = form(data, s);
      const f4 = f[4];
      let disabled = Array.from({length: data().length}, (_, i) => f[i].$.disabled());
      expect(disabled).toEqual([true, false, true, false, true, false]);
      expect(f4.$.disabled()).toBe(true);
      data.set([0, 1, 2, 2.5, 3, 4, 5]);
      disabled = Array.from({length: data().length}, (_, i) => f[i].$.disabled());
      expect(disabled).toEqual([true, false, true, false, false, false, false]);
      expect(f4.$.disabled()).toBe(false);
    });

    it('schema should be extensible', () => {
      const dateSchema = schema<{year: number; month: number; day: number}>((date) => {
        rule(
          date.month,
          when((month) => month() < 1 || month() > 12, error('Must be between 1-12')),
        );
        rule(
          date.day,
          when((day) => day() < 1 || day() > 31, error('Must be between 1-31')),
        );
      });

      const birthdaySchema = dateSchema.extend((date) => {
        rule(
          date.year,
          when((year) => year() > new Date().getFullYear() - 18, error('Must be 18 or older')),
        );
      });

      const f = form(signal({year: 2020, month: 13, day: -2}), birthdaySchema);
      expect(f.year.$.errors()).toEqual([{type: 'custom', message: 'Must be 18 or older'}]);
      expect(f.month.$.errors()).toEqual([{type: 'custom', message: 'Must be between 1-12'}]);
      expect(f.day.$.errors()).toEqual([{type: 'custom', message: 'Must be between 1-31'}]);
    });

    it(`should throw when calling rule and each outside schema`, () => {
      const f = form(signal({}));
      expect(() => rule(f, {})).toThrowError('`rule` can only be called inside `schema`');
      expect(() => each(f, () => {})).toThrowError('`each` can only be called inside `schema`');
    });

    it('should support runtime type validation with zod', () => {
      const s = schema(z.object({x: z.number().min(1), y: z.number()}), (f) => {
        rule(
          f.y,
          when((y) => y() <= f.x.$(), error('y must be greater than x')),
        );
      });
      const f = form(signal({x: 0, y: 0}), s);
      expect(f.x.$.errors().map((e) => e.message)).toEqual([
        'Number must be greater than or equal to 1',
      ]);
      expect(f.y.$.errors().map((e) => e.message)).toEqual(['y must be greater than x']);
    });

    it('should add metadata', () => {
      const s = schema<{x: number; y: number}>((coord) => {
        rule(coord, [
          metadata('label', (value) => `(${value().x}, ${value().y})`),
          when((value) => value().x === 0 && value().y === 0, metadata('origin', true)),
        ]);
      });
      const f = form(signal({x: 0, y: 0}), s);
      expect(f.$.metadata()).toEqual({label: '(0, 0)', origin: true});
      f.x.$.set(1);
      expect(f.$.metadata()).toEqual({label: '(1, 0)'});
    });
  });

  it('nested arrays', () => {
    const s = schema<number[][]>((grid) => {
      each(grid, (row, rowidx) => {
        each(row, (col, colidx) => {
          rule(
            col,
            when(() => rowidx % 2 === 0 && colidx % 2 === 0, error('some error')),
          );
        });
      });
    });

    const f = form(
      signal([
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]),
      s,
    );

    expect(f[0][0].$.errors()).toEqual([{type: 'custom', message: 'some error'}]);
    expect(f[1][0].$.errors()).toEqual([]);
    expect(f[0][1].$.errors()).toEqual([]);
    expect(f[1][1].$.errors()).toEqual([]);
    expect(f[2][2].$.errors()).toEqual([{type: 'custom', message: 'some error'}]);
  });
});
