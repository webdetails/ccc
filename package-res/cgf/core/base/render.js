/**
 * DOC ME: Renders or re-renders a template on a _d3_ selection.
 *
 * Several forms:
 * * (d3Sel, template) — spawn
 * * (d3Sel, template, parentScene) — spawn with parentScene
 * * (d3Sel, spawnedElements) - render given already spawned elements
 * * (d3Sel) — re-render
 *
 * @see cgf.Template#render
 * @see cgf.Template#spawn
 *
 * @alias render
 * @memberOf cgf
 * @function
 * @param {d3.Selection} d3Sel A _d3_ selection.
 * @param {cgf.Template|Array.<cgf.Element>} [template] A template instance or an array of elements.
 * @param {object} [parentScene] The parent scene.
 */
cgf.render = cgf_render;

// TODO: render sub-tree implies attaching new child elements to existing parent elements
// TODO: applicable property value changes... affect the Spawn phase.
// TODO: Template structure and properties are not changed. So bound Element classes remain valid.
//       re-spawning a non-root template implies receiving a series of parent elements...
function cgf_render(d3Sel, template, parentScene) {
    var spawnedElements;
    if(template) {
        if(template instanceof cgf_Template) {
            // SPAWN
            spawnedElements = template.spawn(parentScene);
            // spawnedElements != null
        } else if(def.array.is(template)) {
            spawnedElements = template;
            // spawnedElements != null
            parentScene = template = null;
        } else {
            throw def.error.argumentInvalid('template', "Not a template or an elements array");
        }
    } else {
        // !spawnedElements

        // Re-render with same template and parentScene as before.
        // We don't have access to the previous parentScene,
        // but only to the child-scenes selected from there.
        var firstElem = d3Sel.datum(),
            parentElem = firstElem && firstElem.parent(), // if any
            prevScenes = [];

        template = null;

        d3Sel.each(function(elem) {
            prevScenes.push(elem.scene);
            if(!template) template = elem.template;
        });

        // Nothing to do?
        if(!prevScenes.length) return;

        spawnedElements = template.spawnScenes(parentElem, prevScenes);
    }

    // Sync the dom with spawnedElements
    var keyFun,
        d3UpdSel = d3Sel.selectAll('svg')
            .data(spawnedElements, keyFun);

    d3UpdSel.call(template.render);
}

// 1) Template instances structure and properties.
// 2) Bind -> generates Element classes.
// 3) Spawn template with given scenes.
// 4) Render Visible Visuals to dom, using d3.
//
// 5) Changes are made to some scene objects, not in structure, but in values of its properties.
//
//    Applicability of previously spawned elements may have changed and needs to be re-evaluated
//    (actually, any previously evaluated property of those elements can now be dirty).
//
//    Child elements not previously created, due to belonging to an inapplicable parent
//      may now need to be created.
//    Conversely, child elements previously created may now have its parent in an inapplicable state.
//    Are Elements immutable (except when under layout algos etc)?
//    If so, always replaced by a new one, having re-evaluated property values,
//     for the "same scene" and "parent element" (index may change, and that does not affect identity).
//    So, re-evaluating an element implies replacing it by a new one.
//    However, the children of an element may be replaced.
//    This gets tricky when properties of an element depend on the values of children...
//    So if children can change, the properties of the parent element could to...which goes against the supposed immutability.
//
//    Only hand-off applicable and visible nodes to d3?
//
//    How are created elements having applicable:false handled by d3?
//       * create corresponding DOM nodes but hide them?
//       * not creating the DOM nodes implies filtering these before passing them to d3...
//         (more array copying...more memory)
//         can do this filtering in the data operator function
/**
 * How to bootstrap the render operation?
 *
 *   var template = ...;
 *   var parentScene = {...};
 *   var spawnedElements = template.spawn(parentScene);
 *
 * ------------------
 * From the template?
 *
 *   d3.select(ph)
 *     .data(spawnedElements)
 *     .call(cgf.render)
 *
 *   ^ This would remove any previous datum from the dom nodes in ph,
 *     before we were able to grab them.
 *     We might need this in the future for change detection like stuff.
 *
 *     Anyway, not sure how/if we can grab the previous Element instance before d3,
 *     if we use the data operator...
 *
 * -----------------
 * Not using d3 call:
 *
 *   cgf.render(d3.select(ph), spawnedElements) // d3.Selection, Array.<cgf.Element>
 *
 *     or
 *
 *   cgf.render(d3.select(ph), template, parentScene)  // d3.Selection, cgf.Template[, object=undefined]
 *
 * Now, suppose that the scene is changed, in its interior, somehow.
 * Re-rendering is possible without specifying scene again?
 * Even the template instance could be the same...
 * We can read that from the selection itself.
 *
 * :: datum() -> Element -> template
 *
 *   cgf.render(d3.select(ph))
 *
 *   cgf.render(d3.select(ph), spawnedElements)
 *
 *   cgf.render(d3.select(ph), template)
 *
 *   cgf.render(d3.select(ph), template, scene)
 */
/**
 *      Inheritance, here, means that:
 *        If there's no Update property, use Enter property.
 *        However, if there's an Update property, do not use Enter property as base!
 *        The motivation is that if all template properties were evaluated in each state
 *        the values would be there.
 *        If a later state would not specify a formula for one of these,
 *        the previous state's value would be read.
 *
 *        To avoid having to evaluate properties unless they're actually needed,
 *        in some, possibly later, state,
 *        previous state's formulas are available later for states not overriding these.
 *
 * Element Template Class defaults proto ...
 * Element Template Class defaults
 * Element proto ...
 *      ^
 *      |
 *      * -- EnterTemplate  (within constructor)
 *      ^
 *      |  (or)
 *      |
 *      * -- UpdateTemplate (on Update, if (not 1st Update) or (has Enter, and 1st Update),
 *      ^                               clear Update props, so they can be re-evaluated)
 *      |  (or)
 *      |
 *      * -- ExitTemplate   (on Exit, clear Exit properties, so they can be re-evaluated)
 *
 *   How to do layout with EnterOrUpdate values?
 *   Having previous values bag?
 *
 *            IN
 *            .enter()
 *               .append("foo")
 *               .attr( ... ENTERING-TEMPLATE ... )
 *                  - for immutable properties
 *                  - for initial property values of entry animations
 *
 *            IN + UPD
 *            .update() [after enter]
 *               [.transition()]
 *               .attr( ... STAYED-TEMPLATE ... )
 *                   - entry or update values, possibly animated, from initial to final values.
 *                   - on enter, and no transition, smashes any enter props just set, that are also update props
 *
 *            OUT
 *            .exit()
 *               [.transition()]
 *               .attr( ... EXITED-TEMPLATE ... )
 *               .remove()
 *
 *   * prototype chain on _props?
 *   enter <--- update(0) <--- update(1) <--- update(2) ....
 *
 *   and every Nth time, do a copy to break the proto chain?
 *
 *   This does not solve the need to "inherit" previous states expressions...
 *
 *   Only the access to previous values.
 *
 *   null <-- __prev__ { } <-- __prev__ <--- { } <--- _props <--- [Element]
 *                      |                     |
 *                   template              template
 *                      |                     |
 *                      v                     v
 *               EnteringTemplate        StayedTemplate
 *
 *
 *   Element
 *      * ----o-------->>>--------o-------->>>--------o------>*
 *            |                   |                   |
 *          Enter               Update               Exit
 *        Template             Template            Template
 *        (create)
 *        .enter()             .update()            .exit()
 *
 *
 *
 *
 *  Element -> _props -> { } -> __prev__ -> { }
 *                        ^                  ^
 *                        |                  |
 *                      update             enter
 *
 * Problems
 * 1) Need to know final entry values for layout purposes
 *    before being able to synchronize entering values to the DOM.
 *    Then, when synchronizing the DOM,
 *    need access to the entry values (enter()) and the final values (update()).
 *
 * 2) Knowing previous values may help (someday) optimizing
 *    the synchronize to DOM process,
 *    enabling to skip attrs, styles, props
 *    derived from unchanged template properties.
 *
 */
/**
 * Estratégia de ataque
 *
 * 1) Manter apenas um Template por elemento - o EnterOrUpdate.
 *
 * 2) renderId, version, invalidation?
 *      No protovis, cada vez que um Network layout (o template) é reset, o seu id aumenta.
 *      As cenas do layout, que são reaproveitadas a cada render, têm o id do
 *      layout aquando do seu primeiro render.
 *      Quando o id aumenta, o layout das cenas é recalculado.
 *
 *      No td3, o template está desligado das cenas geradas.
 *      É indefinido o resultado de alterar o template após a geração de cenas.
 *      Logo, ao contrário de no protovis, o id não deve ser guardado no template.
 *
 *      1) Guardar o id do render em cada elemento...
 *      2) O id de o quê?
 *      3) Qd se faz render de uma sub-árvore, tal não invalida os nós acima?
 *      4) Como saber o que re-avaliar?
 *         * Limpar o valor de todas as propriedades variáveis (as que estão em saco em cada elemento).
 *         * Ou seja, todas as de um elemento...
 *         * E se o layout n for para refazer?
 *           Apagam-se todas, mesmo?
 *           Por exemplo, para um interactive re-render?
 *           Propriedades de layout e outras de n layout?
 *              * Cores, stroke-width, radius  => not layout, interactive
 *
 *                baseColor
 *
 *                xi, yi, xdi, ydi => incremental/interactive positions/sizes?
 *
 *                x, y, xd, yd => final laid out positions/sizes?
 *                  x  = left   + xi
 *                  y  = top    + yi
 *                  xd = width  + xdi
 *                  yd = height + ydi
 *
 *              * height, width, left, right, top, bottom => layout
 *                  * stable -> evaluate to user request and
 *                              later fixed with layout decisions
 *
 *        * categories
 *          -> layout      => clear variable interactive also
 *          -> interactive
 *
 *        * clearing =>
 *          a) set to null
 *          b) set dirty bit, in bit vector?
 *              * clear bit on update
 *              * set bit on dirty
 *              + can set multiple bits at once; in update(dirtyBits) ?
 *              + fast to test
 *              - more memory per element
 *              - needs to be in sync with the props bag.
 *              - need property index local to the template...
 *                and immutable for its lifetime...
 *                clearing a property in the template would reassign indexes...
 *              * storage in _props, by name
 *              * dirty flags in a bit vector, by local index
 *                  local index => it is hard to invalidate globally
 *                  cause indexes are local...
 *                  could have a local mask for each category...
 *                  to ease invalidation mapping...
 *
 *               * extra properties, used for proto inheritance,
 *                 do not pose problems to the maintenance of indexes by template meta type.
 *
 *               * properties added to the template instance, on the other hand,
 *                 may bring some challenges...
 *
 * 3) Layout, Panel
 *
 * 4) Construir DOM skins como um mecanismo de render overridable através de JSON+F.
 *    A maior parte do código de render deve ser skinnable.
 *
 * 5) Implementar animação de entrada utilizando DOM skins e eventual re-avaliação do
 *    Element no modo Enter, utilizando escalas anteriores, qd existentes,
 *    ou escalas degeneradas, quando não existentes (c.f. BoxPlot).
 *
 *    a) Guardar propriedades avaliadas no modo update e avaliar o modo enter.
 *    b) Depois repôr as de update
 *
 *    * props não constantes
 *    * props animáveis
 *    * opacity
 *
 * 6) Implementar animação de saída (?)
 */
