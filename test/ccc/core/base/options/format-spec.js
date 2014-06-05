define([
    'ccc/pvc',
    'ccc/def',
    'test/utils',
    'test/data-1'
], function(pvc, def, utils, datas) {

    var cdo = pvc.data;

    var When   = utils.describeTerm("when"),
        Then   = utils.describeTerm("then"),
        After  = utils.describeTerm("after"),
        With   = utils.describeTerm("with"),
        And    = utils.describeTerm("and"),
        The    = utils.describeTerm("the"),
        A      = utils.describeTerm("a"),
        Should = utils.itTerm("should");

    function formatterABC(value) {
        return "ABC" + value;
    }

    function expectNullWrappedABC(ff) {
        expect(typeof ff).toBe('function');
        expect(ff).not.toBe(formatterABC);
        expect(ff._nullWrapped).toBe(1);
        expect(ff(null)).toBe("");
        expect(ff(undefined)).toBe("");
        expect(ff("")).toBe("ABC");
        expect(ff("DE")).toBe("ABCDE");
    }

    describe("pvc.options.format -", function () {

        After("creating the first chart", function() {
            The("pvc.Chart.defaults.valueFormat property", function() {
                Should("have been initialized", function() {
                    utils.createBaseChart();

                    expect(typeof pvc.BaseChart.prototype.defaults.valueFormat).toBe('function');
                });
            });

            The("pvc.Chart.defaults.percentValueFormat property", function() {
                Should("have been initialized", function() {
                    utils.createBaseChart();

                    expect(typeof pvc.BaseChart.prototype.defaults.percentValueFormat).toBe('function');
                });
            });
        });

        When("option 'format' is not specified", function() {
            The("chart property 'format'", function() {
                Should("have a format provider anyway", function() {
                    var chart = utils.createBaseChart();
                    expect(def.classOf(chart.format())).toBe(cdo.format);
                });
            });

            And("'valueFormat' is given a function,", function () {
                The("processed chart options", function() {
                    Should("be set with that function null-wrapped", function() {
                        var chart = utils.createBaseChart({
                            valueFormat: formatterABC
                        });

                        expectNullWrappedABC(chart.options.valueFormat);
                    });
                });

                The("chart's format provider 'number' property", function() {
                    Should("be set to a custom format having that function null-wrapped", function() {
                        var chart = utils.createBaseChart({
                            valueFormat: formatterABC
                        });

                        var vf = chart.format().number();
                        expect(def.is(vf, cdo.customFormat)).toBe(true);

                        expectNullWrappedABC(vf.formatter());
                    });
                });

                A("numeric dimension named 'value", function() {
                    Should("have a custom format with a formatter with that function null-wrapped", function() {
                        var options  = {valueFormat: formatterABC};
                        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
                        var chart    = utils.createBaseChart(options, dataSpec);

                        var complexType   = chart.data.type;
                        var numberDimType = complexType.dimensions('value');

                        var fp = numberDimType.format();
                        expectNullWrappedABC(fp.number().formatter());
                    });
                });

                A("numeric dimension named 'fooo'", function() {
                    Should("have a custom format with a formatter with that function null-wrapped", function() {
                        var options  = {
                            valueFormat: formatterABC
                        };

                        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
                        dataSpec = [
                            dataSpec[0],
                            {crosstabMode: true, readers: ["series, category, fooo"]}
                        ];

                        var chart = utils.createBaseChart(options, dataSpec);

                        var complexType   = chart.data.type;
                        var numberDimType = complexType.dimensions('fooo');

                        var fp = numberDimType.format();
                        expectNullWrappedABC(fp.number().formatter());
                    });
                });
            });

            And("'percentValueFormat' is given a function,", function () {

                The("processed chart options", function() {
                    Should("be set with that function null-wrapped", function() {
                        var chart = utils.createBaseChart({
                            percentValueFormat: formatterABC
                        });

                        expectNullWrappedABC(chart.options.percentValueFormat);
                    });
                });

                The("chart's format provider 'percent' property", function() {
                    Should("be set to a custom format having that function null-wrapped", function() {
                        var chart = utils.createBaseChart({
                            percentValueFormat: formatterABC
                        });

                        var vf = chart.format().percent();
                        expect(def.is(vf, cdo.customFormat)).toBe(true);

                        expectNullWrappedABC(vf.formatter());
                    });
                });

                A("numeric dimension named 'value", function() {
                    Should("have a format provider, with a 'percent' property, having a custom format with a formatter with that function null-wrapped", function() {
                        var options  = {percentValueFormat: formatterABC};
                        var dataSpec = datas['relational, series=city|category=date|value=qty, square form'];
                        var chart    = utils.createBaseChart(options, dataSpec);

                        var complexType   = chart.data.type;
                        var numberDimType = complexType.dimensions('value');

                        var fp = numberDimType.format();
                        expectNullWrappedABC(fp.percent().formatter());
                    });
                });
            });
        });

        When("option 'format' is specified", function() {
            With("a format provider,", function() {
                The("chart property 'format'", function() {
                    Should("have that format provider", function() {
                        var fp1 = cdo.format();
                        var chart = utils.createBaseChart({
                            format: fp1
                        });

                        var fp2 = chart.format();
                        expect(fp2).toBe(fp1);
                    });
                });
            });

            With("a JSON", function() {
                The("chart property 'format'", function() {
                    Should("have the format provider configured with that JSON", function() {
                        var chart = utils.createBaseChart({
                            format: {
                                number:  formatterABC,
                                percent: formatterABC,
                                date:    formatterABC,
                                any:     formatterABC
                            }
                        });

                        var fp = chart.format();
                        expect(def.classOf(fp)).toBe(cdo.format);

                        expect(fp.number ().formatter()).toBe(formatterABC);
                        expect(fp.percent().formatter()).toBe(formatterABC);
                        expect(fp.date   ().formatter()).toBe(formatterABC);
                        expect(fp.any    ().formatter()).toBe(formatterABC);
                    });
                });

                With("a 'number' property", function() {
                    The("chart option 'valueFormat'", function() {
                        Should("be set to the resulting 'number' format", function() {
                            var chart = utils.createBaseChart({
                                format: {
                                    number:  formatterABC
                                }
                            });

                            var nf = chart.format().number();
                            expect(chart.options.valueFormat).toBe(nf);
                        });
                    });
                });

                With("a 'percent' property", function() {
                    The("chart option 'percentValueFormat'", function() {
                        Should("be set to the resulting 'number' format", function() {
                            var chart = utils.createBaseChart({
                                format: {
                                    percent:  formatterABC
                                }
                            });

                            var nf = chart.format().percent();
                            expect(chart.options.percentValueFormat).toBe(nf);
                        });
                    });
                });
            });
        });
    });
});