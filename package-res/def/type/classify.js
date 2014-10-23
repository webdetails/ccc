
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
     * (actually, constructor functions also have this ability, but it's non-recommended pattern).
     * Knowledge of this kind of class relies on explicit annotation of an instance
     * by use of the {@link def.classify} function.
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
     * @param {any} v The value to test.
     * @param {function} Class The class function to test.
     *
     * @return {boolean}
     * <tt>true</tt>, if it is and instance,
     * <tt>false</tt>, if not.
     */
    is: function(v, Class) {
        return !!v && ((v._class && v._class === Class) || (v instanceof Class));
    },

    /**
     * Returns
     * the <i>v</i> argument, when it is an instance of the provided class, or,
     * the <i>fv</i> argument, otherwise.
     *
     * @param {any} v The value to test.
     * @param {function} Class The class function to test.
     * @param {any} [fv=undefined] The value to return when the value is
     *     <i>not</i> an instance of the provided class.
     * @return {boolean}
     * <tt>true</tt>, if it is an instance,
     * <tt>false</tt>, if not.
     */
    as: function(v, Class, fv) {
        return def.is(v, Class) ? v : fv;
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
        function asClass(v) {
            return def.as(v, Class);
        }
        return asClass;
    }
});
