/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/

// Class convention

def.copyOwn(def, /** @lends def */{
    /**
     * Classifies an object value in a given class.
     *
     * @param {object} v The value whose class is being stated.
     * @param {function} Class The class of the value.
     * @return {object} The value in <i>v</i>.
     * @see def.classOf
     */
    classify: function(v, Class) {
        def.setNonEnum(v, '_class', Class);
        return v;
    },

    /**
     * Obtains the class of a value, returning <tt>undefined</tt>, when there is none.
     *
     * Two kinds of "classes" are considered.
     *
     * The most obvious one is that of classes represented by a <i>constructor</i> function.
     * Instances of this kind of class are created by explicitly using the <tt>new</tt> operator,
     * as in <tt>var inst = new ClassConstructor()</tt>.
     * Unless explicitly changed, the class of an instance
     * created this way is present in its <i>constructor</i> property.
     *
     * The other less obvious one is that of classes represented by a <i>factory</i> function.
     * Factory functions are called directly and not using the <tt>new</tt> operator.
     * A factory function abstracts the code from the actual provenance of the instances it returns.
     * Additionally, a factory function is not required to create a new instance, every time it is called
     * (actually, constructor functions also have this ability, but it's a non-recommended pattern).
     * Knowledge of this kind of class relies on explicit annotation of an instance
     * by use of the {@link def.classify} function.
     *
     * Sometimes,
     * factory functions are used to wrap, and not to hide,
     * the creation of instances of regular JavaScript "classes",
     * possibly creating instances in special ways.
     *
     * A factory function like this can state the underlying constructor (or base one)
     * of the instances it creates,
     * by having that constructor in a property named <i>of</i>.
     * The function {@link def.is} will return <tt>true</tt> if
     * an instance of this constructor is tested against a factory stating it.
     *
     * This function gives precedence to the annotated class of an instance, when there is one,
     * falling back to the value of the <i>constructor</i> property, when not.
     * Lastly, when the value is not an object, or has no defined constructor,
     * the value <tt>undefined</tt> is returned.
     *
     * @param {any} v The value whose class is to be obtained.
     * @return {function|undefined} The class of the value, or <tt>undefined</tt>, when there is none.
     */
    classOf: function(v) {
        // NOTE: _class can be inherited (just like constructor)
        return (v && (v._class || v.constructor)) || undefined;
    },

    /**
     * Indicates whether a value is an instance of a class.
     *
     * The provided <i>Class</i> can be one of:
     * <ul>
     *     <li>a function on which <i>v</i> was previously classified,</i>
     *     <li>a factory function that has an <i>of</i> property having a constructor function,
     *         which is then used by the <tt>instanceof</tt> operator</li>
     *     <li>the constructor of <i>v</i> or one which is a base constructor of it.</li>
     * </ul>
     *
     * @param {any} v The value to test.
     * @param {function} Class The class function to test.
     *
     * @return {boolean}
     * <tt>true</tt>, if it is and instance,
     * <tt>false</tt>, if not.
     */
    is: function(v, Class) {
        return !!v && ((v._class && v._class === Class) || (v instanceof (Class.of ||Class)));
    },

    /**
     * Returns
     * the <i>v</i> argument, when it is an instance of the provided class, or,
     * the <i>dv</i> argument, otherwise.
     *
     * @param {any} v The value to test.
     * @param {function} Class The class function to test.
     * @param {any} [dv=undefined] The value to return when the value is
     *     <i>not</i> an instance of the provided class.
     * @return {boolean}
     * <tt>true</tt>, if it is an instance,
     * <tt>false</tt>, if not.
     */
    as: function(v, Class, dv) {
        return def.is(v, Class) ? v : dv;
    },

    /**
     * Creates a predicate "is" function
     * that tests if values are of the here specified class.
     * @param {function} Class The class that the predicate will test.
     * @return {function} The created predicate function.
     * @see def.is
     */
    createIs: function(Class) {
        function isClass(v) {
            return def.is(v, Class);
        }
        return isClass;
    },

    /**
     * Creates an "as" function
     * that "filters" values of a here specified class.
     * @param {function} Class The class that the "as" function will test.
     * @return {function} The created function.
     * @see def.as
     */
    createAs: function(Class) {
        function asClass(v, dv) {
            return def.as(v, Class, dv);
        }
        return asClass;
    },

    /**
     * Determines if a class is, or inherits from, another.
     * @param {function} Ctor The class constructor.
     * @param {function} BaseCtor The base class constructor.
     * @return {boolean} `true` if `Ctor` is or inherits from `BaseCtor`.
     */
    isSubClassOf: function(Ctor, BaseCtor) {
        return !!(Ctor && BaseCtor) && ((Ctor === BaseCtor) || def.is(F_protoOrSelf(Ctor), BaseCtor));
    }
});
