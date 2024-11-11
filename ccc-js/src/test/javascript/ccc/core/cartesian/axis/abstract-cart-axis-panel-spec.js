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
define([
    'ccc/pvc',
    "test/utils",
    "test/data-1"
], function(pvc, utils, dataSpecs) {

    describe("pvc.AxisPanel", function() {

        describe("_calcDiscreteOverlapSettings", function() {
            var angle0 = 0;
            var angle45 = 45 * (Math.PI / 180);
            var angle90 = 90 * (Math.PI / 180);
            var angle135 = 135 * (Math.PI / 180);
            var angle180 = 180 * (Math.PI / 180);
            var angle225 = 225 * (Math.PI / 180);
            var angle270 = 270 * (Math.PI / 180);
            var angle315 = 315 * (Math.PI / 180);
            var angle360 = 360 * (Math.PI / 180);

            var desiredAngle0 = 0;
            var desiredAngle1 = 20 * (Math.PI / 180);
            var desiredAngle2 = 40 * (Math.PI / 180);
            var desiredAngle3 = 60 * (Math.PI / 180);

            function settingsThatFit(overlappedLabelsMode, axisAnchor, a) {
                var settings = {
                    overlappedLabelsMode: overlappedLabelsMode,
                    labelRotationDirection: 1,
                    labelDesiredAngles: [],
                    layoutInfo: {
                        textAngle: a,
                        ticks: [1, 2, 3, 4, 5], // five ticks
                        textHeight: 10, // each label takes 10px height
                        maxTextWidth: 12 // the biggest label takes 12px width
                    },
                    axisAnchor: axisAnchor,
                    labelSpacingMin: 0.2, // minimum em distance between labels
                    fontPxWidth: 10, // px width of x char
                    expectedMinAngle: 0,
                    expectedMaxAngle: Math.PI * 2
                };

                var isHorizontal = axisAnchor === "bottom" || axisAnchor === "top";

                var h = settings.layoutInfo.textHeight;
                var w = settings.layoutInfo.maxTextWidth;

                var sMin = h * settings.labelSpacingMin, /* parameter in em */
                    sMinH = sMin, // Between baselines
                    sMinW = settings.fontPxWidth + sMin; // Between sides (orthogonal to baseline)

                var projected_size;
                if (isHorizontal) {
                    projected_size = Math.min(w, Math.abs(h / Math.sin(a))) + sMinW;
                } else {
                    projected_size = Math.min(w, Math.abs(h / Math.cos(a))) + sMinH;
                }

                // px distance between ticks
                settings.distanceBetweenTicks = projected_size + (Math.ceil(0.1 * projected_size));

                return settings;
            }

            function settingsThatDontFit(overlappedLabelsMode, axisAnchor, a) {
                var settings = settingsThatFit(overlappedLabelsMode, axisAnchor, a);

                // remove 10%, so the labels don't fit anymore
                settings.distanceBetweenTicks = settings.distanceBetweenTicks / 1.1 - (Math.ceil(0.1 * settings.distanceBetweenTicks));

                var isHorizontal = axisAnchor === "bottom" || axisAnchor === "top";

                var h = settings.layoutInfo.textHeight;

                var sMin = h * settings.labelSpacingMin, /* parameter in em */
                    sMinH = sMin, // Between baselines
                    sMinW = settings.fontPxWidth + sMin; // Between sides (orthogonal to baseline)

                if (isHorizontal) {
                    settings.expectedMinAngle = Math.asin(h / (settings.distanceBetweenTicks - sMinH));
                } else {
                    settings.expectedMaxAngle = Math.acos(h / (settings.distanceBetweenTicks - sMinH));
                }

                return settings;
            }

            var axisAnchor;
            var overlappedLabelsMode;

            var settings;

            it("is defined", function() {
                expect(pvc.AxisPanel._calcDiscreteOverlapSettings).toBeDefined();
            });

            describe("horizontal axis", function() {
                beforeEach(function() {
                    axisAnchor = "top";
                });

                describe("overlappedLabelsMode: leave", function() {
                    beforeEach(function() {
                        overlappedLabelsMode = "leave";
                    });

                    describe("it fits", function() {
                        beforeEach(function() {
                            settings = settingsThatFit(overlappedLabelsMode, axisAnchor, 0);

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );
                        });

                        it("all ticks should be visible", function() {
                            expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                        });

                        it("should not lock textAngle, textAlign and textBaseline", function() {
                            expect(settings.layoutInfo.textAngleLocked).not.toBe(true);
                            expect(settings.layoutInfo.textAlignLocked).not.toBe(true);
                            expect(settings.layoutInfo.textBaselineLocked).not.toBe(true);
                        });
                    });

                    describe("it doesn't fit", function() {
                        beforeEach(function() {
                            settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );
                        });

                        it("all ticks should be visible", function() {
                            expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                        });

                        it("should not lock textAngle, textAlign and textBaseline", function() {
                            expect(settings.layoutInfo.textAngleLocked).not.toBe(true);
                            expect(settings.layoutInfo.textAlignLocked).not.toBe(true);
                            expect(settings.layoutInfo.textBaselineLocked).not.toBe(true);
                        });
                    });
                });

                describe("overlappedLabelsMode: hide", function() {
                    beforeEach(function() {
                        overlappedLabelsMode = "hide";
                    });

                    describe("it fits", function() {
                        beforeEach(function() {
                            settings = settingsThatFit(overlappedLabelsMode, axisAnchor, 0);

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );
                        });

                        it("all ticks should be visible", function() {
                            expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                        });

                        it("should lock textAngle", function() {
                            expect(settings.layoutInfo.textAngleLocked).toBe(true);
                        });

                        it("should not lock textAlign and textBaseline", function() {
                            expect(settings.layoutInfo.textAlignLocked).not.toBe(true);
                            expect(settings.layoutInfo.textBaselineLocked).not.toBe(true);
                        });
                    });

                    describe("it doesn't fit", function() {
                        beforeEach(function() {
                            settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );
                        });

                        it("some ticks should be hidden", function() {
                            expect(settings.layoutInfo.tickVisibilityStep).toBeGreaterThan(1);
                        });

                        it("should lock textAngle", function() {
                            expect(settings.layoutInfo.textAngleLocked).toBe(true);
                        });

                        it("should not lock textAlign and textBaseline", function() {
                            expect(settings.layoutInfo.textAlignLocked).not.toBe(true);
                            expect(settings.layoutInfo.textBaselineLocked).not.toBe(true);
                        });
                    });

                    describe("it doesn't fit but visibility step would equal or exceed the number of ticks", function() {
                        beforeEach(function() {
                            settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                            settings.distanceBetweenTicks = settings.layoutInfo.textHeight * settings.labelSpacingMin + settings.fontPxWidth + 0.1;
                            settings.layoutInfo.maxTextWidth = 25;
                            settings.layoutInfo.ticks = [1, 2, 3, 4];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );
                        });

                        it("all ticks should be visible", function() {
                            expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                        });
                    });

                    describe("number of ticks is less than 3", function() {
                        beforeEach(function() {
                            settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                            settings.layoutInfo.ticks = [1, 2];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );
                        });

                        it("all ticks should be visible", function() {
                            expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                        });
                    });
                });

                describe("overlappedLabelsMode: rotate", function() {
                    beforeEach(function() {
                        overlappedLabelsMode = "rotate";
                    });

                    describe("no desired angles", function() {
                        describe("it fits", function() {
                            beforeEach(function() {
                                settings = settingsThatFit(overlappedLabelsMode, axisAnchor, 0);

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the minimum non-overlapping angle (always zero)", function() {
                                expect(settings.layoutInfo.textAngle).toBe(settings.expectedMinAngle);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });

                        describe("it doesn't fit (but will with the minimum non-overlapping angle)", function() {
                            beforeEach(function() {
                                settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the minimum non-overlapping angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(settings.expectedMinAngle);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });

                        describe("it doesn't fit (and never will)", function() {
                            beforeEach(function() {
                                settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                                settings.distanceBetweenTicks = settings.layoutInfo.textHeight;

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the less overlapping angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(Math.PI / 2);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });
                    });

                    describe("with desired angles", function() {
                        describe("it fits", function() {
                            beforeEach(function() {
                                settings = settingsThatFit(overlappedLabelsMode, axisAnchor, 0);

                                settings.labelDesiredAngles = [desiredAngle2, desiredAngle3];

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the first desired angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(desiredAngle2);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });

                        describe("it doesn't fit - bigger desired", function() {
                            beforeEach(function() {
                                settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                                settings.labelDesiredAngles = [desiredAngle1, desiredAngle2, desiredAngle3];

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the first desired angle above the minimum non-overlapping angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(desiredAngle2);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });

                        describe("it doesn't fit - no bigger desire", function() {
                            beforeEach(function() {
                                settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                                settings.labelDesiredAngles = [desiredAngle0, desiredAngle1];

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the last desired angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(desiredAngle1);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });
                    });
                });

                describe("overlappedLabelsMode: rotatethenhide", function() {
                    beforeEach(function() {
                        overlappedLabelsMode = "rotatethenhide";
                    });

                    describe("no desired angles", function() {
                        describe("it fits", function() {
                            beforeEach(function() {
                                settings = settingsThatFit(overlappedLabelsMode, axisAnchor, 0);

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the minimum non-overlapping angle (always zero)", function() {
                                expect(settings.layoutInfo.textAngle).toBe(settings.expectedMinAngle);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });

                        describe("it doesn't fit (but will with the minimum non-overlapping angle)", function() {
                            beforeEach(function() {
                                settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the minimum non-overlapping angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(settings.expectedMinAngle);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });

                        describe("it doesn't fit (and never will)", function() {
                            beforeEach(function() {
                                settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                                settings.distanceBetweenTicks = settings.layoutInfo.textHeight;

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("some ticks should be hidden", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBeGreaterThan(1);
                            });

                            it("should change textAngle to the less overlapping angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(Math.PI / 2);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });
                    });

                    describe("with desired angles", function() {
                        describe("it fits", function() {
                            beforeEach(function() {
                                settings = settingsThatFit(overlappedLabelsMode, axisAnchor, 0);

                                settings.labelDesiredAngles = [desiredAngle2, desiredAngle3];

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the first desired angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(desiredAngle2);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });

                        describe("it doesn't fit - bigger desired", function() {
                            beforeEach(function() {
                                settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                                settings.labelDesiredAngles = [desiredAngle1, desiredAngle2, desiredAngle3];

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the first desired angle above the minimum non-overlapping angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(desiredAngle2);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });

                        describe("it doesn't fit - no bigger desire", function() {
                            beforeEach(function() {
                                settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                                settings.labelDesiredAngles = [desiredAngle0, desiredAngle1];

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("some ticks should be hidden", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBeGreaterThan(1);
                            });

                            it("should change textAngle to the last desired angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(desiredAngle1);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });
                    });
                });

                describe("automatic label anchor", function() {
                    describe("on bottom", function() {
                        beforeEach(function() {
                            settings = settingsThatFit("rotate", "bottom", 0);
                        });

                        it("horizontal (0°) - should anchor on top center", function() {
                            settings.labelDesiredAngles = [angle0];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("top");
                            expect(settings.layoutInfo.textAlign).toBe("center");
                        });

                        it("diagonal (45°) - should anchor on top left", function() {
                            settings.labelDesiredAngles = [angle45];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("top");
                            expect(settings.layoutInfo.textAlign).toBe("left");
                        });

                        it("vertical (90°) - should anchor on middle left", function() {
                            settings.labelDesiredAngles = [angle90];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("middle");
                            expect(settings.layoutInfo.textAlign).toBe("left");
                        });

                        it("diagonal (135°) - should anchor on bottom left", function() {
                            settings.labelDesiredAngles = [angle135];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("bottom");
                            expect(settings.layoutInfo.textAlign).toBe("left");
                        });

                        it("horizontal (180°) - should anchor on bottom center", function() {
                            settings.labelDesiredAngles = [angle180];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("bottom");
                            expect(settings.layoutInfo.textAlign).toBe("center");
                        });

                        it("diagonal (225°) - should anchor on bottom right", function() {
                            settings.labelDesiredAngles = [angle225];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("bottom");
                            expect(settings.layoutInfo.textAlign).toBe("right");
                        });

                        it("vertical (270°) - should anchor on middle right", function() {
                            settings.labelDesiredAngles = [angle270];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("middle");
                            expect(settings.layoutInfo.textAlign).toBe("right");
                        });

                        it("diagonal (315°) - should anchor on top right", function() {
                            settings.labelDesiredAngles = [angle315];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("top");
                            expect(settings.layoutInfo.textAlign).toBe("right");
                        });

                        it("horizontal (360°) - should anchor on top center", function() {
                            settings.labelDesiredAngles = [angle360];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("top");
                            expect(settings.layoutInfo.textAlign).toBe("center");
                        });
                    });

                    describe("on top", function() {
                        beforeEach(function() {
                            settings = settingsThatFit("rotate", "top", 0);
                        });

                        it("horizontal (0°) - should anchor on bottom center", function() {
                            settings.labelDesiredAngles = [angle0];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("bottom");
                            expect(settings.layoutInfo.textAlign).toBe("center");
                        });

                        it("diagonal (45°) - should anchor on bottom right", function() {
                            settings.labelDesiredAngles = [angle45];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("bottom");
                            expect(settings.layoutInfo.textAlign).toBe("right");
                        });

                        it("vertical (90°) - should anchor on middle right", function() {
                            settings.labelDesiredAngles = [angle90];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("middle");
                            expect(settings.layoutInfo.textAlign).toBe("right");
                        });

                        it("diagonal (135°) - should anchor on top right", function() {
                            settings.labelDesiredAngles = [angle135];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("top");
                            expect(settings.layoutInfo.textAlign).toBe("right");
                        });

                        it("horizontal (180°) - should anchor on top center", function() {
                            settings.labelDesiredAngles = [angle180];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("top");
                            expect(settings.layoutInfo.textAlign).toBe("center");
                        });

                        it("diagonal (225°) - should anchor on top left", function() {
                            settings.labelDesiredAngles = [angle225];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("top");
                            expect(settings.layoutInfo.textAlign).toBe("left");
                        });

                        it("vertical (270°) - should anchor on middle left", function() {
                            settings.labelDesiredAngles = [angle270];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("middle");
                            expect(settings.layoutInfo.textAlign).toBe("left");
                        });

                        it("diagonal (315°) - should anchor on bottom left", function() {
                            settings.labelDesiredAngles = [angle315];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("bottom");
                            expect(settings.layoutInfo.textAlign).toBe("left");
                        });

                        it("horizontal (360°) - should anchor on bottom center", function() {
                            settings.labelDesiredAngles = [angle360];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("bottom");
                            expect(settings.layoutInfo.textAlign).toBe("center");
                        });
                    });
                });
            });

            describe("vertical axis", function() {
                beforeEach(function() {
                    axisAnchor = "left";
                });

                describe("overlappedLabelsMode: leave", function() {
                    beforeEach(function() {
                        overlappedLabelsMode = "leave";
                    });

                    describe("it fits", function() {
                        beforeEach(function() {
                            settings = settingsThatFit(overlappedLabelsMode, axisAnchor, 0);

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );
                        });

                        it("all ticks should be visible", function() {
                            expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                        });

                        it("should not lock textAngle, textAlign and textBaseline", function() {
                            expect(settings.layoutInfo.textAngleLocked).not.toBe(true);
                            expect(settings.layoutInfo.textAlignLocked).not.toBe(true);
                            expect(settings.layoutInfo.textBaselineLocked).not.toBe(true);
                        });
                    });

                    describe("it doesn't fit", function() {
                        beforeEach(function() {
                            settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );
                        });

                        it("all ticks should be visible", function() {
                            expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                        });

                        it("should not lock textAngle, textAlign and textBaseline", function() {
                            expect(settings.layoutInfo.textAngleLocked).not.toBe(true);
                            expect(settings.layoutInfo.textAlignLocked).not.toBe(true);
                            expect(settings.layoutInfo.textBaselineLocked).not.toBe(true);
                        });
                    });
                });

                describe("overlappedLabelsMode: hide", function() {
                    beforeEach(function() {
                        overlappedLabelsMode = "hide";
                    });

                    describe("it fits", function() {
                        beforeEach(function() {
                            settings = settingsThatFit(overlappedLabelsMode, axisAnchor, 0);

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );
                        });

                        it("all ticks should be visible", function() {
                            expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                        });

                        it("should lock textAngle", function() {
                            expect(settings.layoutInfo.textAngleLocked).toBe(true);
                        });

                        it("should not lock textAlign and textBaseline", function() {
                            expect(settings.layoutInfo.textAlignLocked).not.toBe(true);
                            expect(settings.layoutInfo.textBaselineLocked).not.toBe(true);
                        });
                    });

                    describe("it doesn't fit", function() {
                        beforeEach(function() {
                            settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );
                        });

                        it("some ticks should be hidden", function() {
                            expect(settings.layoutInfo.tickVisibilityStep).toBeGreaterThan(1);
                        });

                        it("should lock textAngle", function() {
                            expect(settings.layoutInfo.textAngleLocked).toBe(true);
                        });

                        it("should not lock textAlign and textBaseline", function() {
                            expect(settings.layoutInfo.textAlignLocked).not.toBe(true);
                            expect(settings.layoutInfo.textBaselineLocked).not.toBe(true);
                        });
                    });
                });

                describe("overlappedLabelsMode: rotate", function() {
                    beforeEach(function() {
                        overlappedLabelsMode = "rotate";
                    });

                    describe("no desired angles", function() {
                        describe("it fits", function() {
                            beforeEach(function() {
                                settings = settingsThatFit(overlappedLabelsMode, axisAnchor, 0);

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the minimum non-overlapping angle (always zero)", function() {
                                expect(settings.layoutInfo.textAngle).toBe(settings.expectedMinAngle);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });

                        describe("it doesn't fit", function() {
                            beforeEach(function() {
                                settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the minimum non-overlapping angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(settings.expectedMinAngle);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });
                    });

                    describe("with desired angles", function() {
                        describe("it fits and the desired angle is smaller than the maximum non-overlapping angle", function() {
                            beforeEach(function() {
                                settings = settingsThatFit(overlappedLabelsMode, axisAnchor, 0);

                                settings.labelDesiredAngles = [desiredAngle1, desiredAngle2];

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the first desired angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(desiredAngle1);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });

                        describe("it did fit, but the desired angle is bigger than the maximum non-overlapping angle", function() {
                            beforeEach(function() {
                                settings = settingsThatFit(overlappedLabelsMode, axisAnchor, 0);

                                settings.labelDesiredAngles = [desiredAngle2, desiredAngle3];

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the first desired angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(desiredAngle2);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });

                        describe("it doesn't fit and desired angle is smaller than the maximum non-overlapping angle", function() {
                            beforeEach(function() {
                                settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                                settings.labelDesiredAngles = [desiredAngle1, desiredAngle2];

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the last desired angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(desiredAngle2);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });

                        describe("it doesn't fit and desired angle is bigger than the maximum non-overlapping angle", function() {
                            beforeEach(function() {
                                settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                                settings.labelDesiredAngles = [desiredAngle3];

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the last desired angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(desiredAngle3);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });
                    });
                });

                describe("overlappedLabelsMode: rotatethenhide", function() {
                    beforeEach(function() {
                        overlappedLabelsMode = "rotatethenhide";
                    });

                    describe("no desired angles", function() {
                        describe("it fits", function() {
                            beforeEach(function() {
                                settings = settingsThatFit(overlappedLabelsMode, axisAnchor, 0);

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the minimum non-overlapping angle (always zero)", function() {
                                expect(settings.layoutInfo.textAngle).toBe(settings.expectedMinAngle);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });

                        describe("it doesn't fit", function() {
                            beforeEach(function() {
                                settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("some ticks should be hidden", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBeGreaterThan(1);
                            });

                            it("should change textAngle to the minimum non-overlapping angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(settings.expectedMinAngle);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });
                    });

                    describe("with desired angles", function() {
                        describe("it fits and the desired angle is smaller than the maximum non-overlapping angle", function() {
                            beforeEach(function() {
                                settings = settingsThatFit(overlappedLabelsMode, axisAnchor, 0);

                                settings.labelDesiredAngles = [desiredAngle1, desiredAngle2];

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("all ticks should be visible", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBe(1);
                            });

                            it("should change textAngle to the first desired angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(desiredAngle1);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });

                        describe("it did fit, but the desired angle is bigger than the maximum non-overlapping angle", function() {
                            beforeEach(function() {
                                settings = settingsThatFit(overlappedLabelsMode, axisAnchor, 0);

                                settings.labelDesiredAngles = [desiredAngle2, desiredAngle3];

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("some ticks should be hidden", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBeGreaterThan(1);
                            });

                            it("should change textAngle to the first desired angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(desiredAngle2);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });

                        describe("it doesn't fit", function() {
                            beforeEach(function() {
                                settings = settingsThatDontFit(overlappedLabelsMode, axisAnchor, 0);

                                settings.labelDesiredAngles = [desiredAngle1, desiredAngle2];

                                pvc.AxisPanel._calcDiscreteOverlapSettings(
                                    settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                    settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                    settings.layoutInfo
                                );
                            });

                            it("some ticks should be hidden", function() {
                                expect(settings.layoutInfo.tickVisibilityStep).toBeGreaterThan(1);
                            });

                            it("should change textAngle to the last desired angle", function() {
                                expect(settings.layoutInfo.textAngle).toBe(desiredAngle2);
                            });

                            it("should lock textAngle", function() {
                                expect(settings.layoutInfo.textAngleLocked).toBe(true);
                            });

                            it("should lock textAlign and textBaseline", function() {
                                expect(settings.layoutInfo.textAlignLocked).toBe(true);
                                expect(settings.layoutInfo.textBaselineLocked).toBe(true);
                            });
                        });
                    });
                });

                describe("automatic label anchor", function() {
                    describe("on left", function() {
                        beforeEach(function() {
                            settings = settingsThatFit("rotate", "left", 0);
                        });

                        it("horizontal (0°) - should anchor on middle right", function() {
                            settings.labelDesiredAngles = [angle0];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("middle");
                            expect(settings.layoutInfo.textAlign).toBe("right");
                        });

                        it("diagonal (45°) - should anchor on top right", function() {
                            settings.labelDesiredAngles = [angle45];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("top");
                            expect(settings.layoutInfo.textAlign).toBe("right");
                        });

                        it("vertical (90°) - should anchor on top center", function() {
                            settings.labelDesiredAngles = [angle90];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("top");
                            expect(settings.layoutInfo.textAlign).toBe("center");
                        });

                        it("diagonal (135°) - should anchor on top left", function() {
                            settings.labelDesiredAngles = [angle135];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("top");
                            expect(settings.layoutInfo.textAlign).toBe("left");
                        });

                        it("horizontal (180°) - should anchor on middle left", function() {
                            settings.labelDesiredAngles = [angle180];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("middle");
                            expect(settings.layoutInfo.textAlign).toBe("left");
                        });

                        it("diagonal (225°) - should anchor on bottom left", function() {
                            settings.labelDesiredAngles = [angle225];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("bottom");
                            expect(settings.layoutInfo.textAlign).toBe("left");
                        });

                        it("vertical (270°) - should anchor on bottom center", function() {
                            settings.labelDesiredAngles = [angle270];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("bottom");
                            expect(settings.layoutInfo.textAlign).toBe("center");
                        });

                        it("diagonal (315°) - should anchor on bottom right", function() {
                            settings.labelDesiredAngles = [angle315];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("bottom");
                            expect(settings.layoutInfo.textAlign).toBe("right");
                        });

                        it("horizontal (360°) - should anchor on middle right", function() {
                            settings.labelDesiredAngles = [angle360];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("middle");
                            expect(settings.layoutInfo.textAlign).toBe("right");
                        });
                    });

                    describe("on right", function() {
                        beforeEach(function() {
                            settings = settingsThatFit("rotate", "right", 0);
                        });

                        it("horizontal (0°) - should anchor on middle left", function() {
                            settings.labelDesiredAngles = [angle0];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("middle");
                            expect(settings.layoutInfo.textAlign).toBe("left");
                        });

                        it("diagonal (45°) - should anchor on bottom left", function() {
                            settings.labelDesiredAngles = [angle45];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("bottom");
                            expect(settings.layoutInfo.textAlign).toBe("left");
                        });

                        it("vertical (90°) - should anchor on bottom center", function() {
                            settings.labelDesiredAngles = [angle90];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("bottom");
                            expect(settings.layoutInfo.textAlign).toBe("center");
                        });

                        it("diagonal (135°) - should anchor on bottom right", function() {
                            settings.labelDesiredAngles = [angle135];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("bottom");
                            expect(settings.layoutInfo.textAlign).toBe("right");
                        });

                        it("horizontal (180°) - should anchor on middle right", function() {
                            settings.labelDesiredAngles = [angle180];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("middle");
                            expect(settings.layoutInfo.textAlign).toBe("right");
                        });

                        it("diagonal (225°) - should anchor on top right", function() {
                            settings.labelDesiredAngles = [angle225];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("top");
                            expect(settings.layoutInfo.textAlign).toBe("right");
                        });

                        it("vertical (270°) - should anchor on top center", function() {
                            settings.labelDesiredAngles = [angle270];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("top");
                            expect(settings.layoutInfo.textAlign).toBe("center");
                        });

                        it("diagonal (315°) - should anchor on top left", function() {
                            settings.labelDesiredAngles = [angle315];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("top");
                            expect(settings.layoutInfo.textAlign).toBe("left");
                        });

                        it("horizontal (360°) - should anchor on middle left", function() {
                            settings.labelDesiredAngles = [angle360];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );

                            expect(settings.layoutInfo.textBaseline).toBe("middle");
                            expect(settings.layoutInfo.textAlign).toBe("left");
                        });
                    });
                });
            });

            describe("labelRotationDirection", function() {
                describe("clockwise", function() {
                    describe("using textAngle", function() {
                        beforeEach(function() {
                            settings = settingsThatFit("hide", "bottom", angle45);

                            settings.labelRotationDirection = 1;

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );
                        });

                        it("textAngle value should not change", function() {
                            expect(settings.layoutInfo.textAngle).toBe(angle45);
                        });
                    });

                    describe("using desired angles", function() {
                        beforeEach(function() {
                            settings = settingsThatFit("rotate", "bottom", 0);

                            settings.labelRotationDirection = 1;
                            settings.labelDesiredAngles = [angle45];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );
                        });

                        it("textAngle value should be the desired angle", function() {
                            expect(settings.layoutInfo.textAngle).toBe(angle45);
                        });
                    });

                    describe("defaults to clockwise", function() {
                        beforeEach(function() {
                            settings = settingsThatFit("hide", "bottom", angle45);

                            settings.labelRotationDirection = undefined;

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );
                        });

                        it("textAngle value should not change", function() {
                            expect(settings.layoutInfo.textAngle).toBe(angle45);
                        });
                    });
                });

                describe("counterclockwise", function() {
                    describe("using textAngle", function() {
                        beforeEach(function() {
                            settings = settingsThatFit("hide", "bottom", angle45);

                            settings.labelRotationDirection = -1;

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );
                        });

                        it("textAngle value should be one full turn minus the original angle", function() {
                            expect(settings.layoutInfo.textAngle).toBe(angle315);
                        });
                    });

                    describe("using desired angles", function() {
                        beforeEach(function() {
                            settings = settingsThatFit("rotate", "bottom", 0);

                            settings.labelRotationDirection = -1;
                            settings.labelDesiredAngles = [angle45];

                            pvc.AxisPanel._calcDiscreteOverlapSettings(
                                settings.overlappedLabelsMode, settings.labelRotationDirection, settings.labelDesiredAngles,
                                settings.distanceBetweenTicks, settings.labelSpacingMin, settings.fontPxWidth, settings.axisAnchor,
                                settings.layoutInfo
                            );
                        });

                        it("textAngle value should be one full turn minus the desired angle", function() {
                            expect(settings.layoutInfo.textAngle).toBe(angle315);
                        });
                    });
                });
            });
        });

        describe("label overflow", function() {

            // CDF-913
            describe("in an axis with fixed size or sizeMax and long ticks' text", function() {
                it("should not consider label overflow the label text that is not visible due to sizeMax", function() {
                    var chart = utils.createAndLayoutChart(pvc.BarChart, {
                        // Reset
                        animate: false,
                        interactive: true,
                        axisOffset: 0,
                        margins: 0,
                        paddings: 0,
                        contentPaddings: 0,
                        contentMargins: 0,

                        // ---
                        width:  600,
                        height: 400,
                        baseAxisSizeMax: 70,
                        baseAxisLabel_textAngle: -Math.PI/4,
                        baseAxisLabel_textAlign: 'right'
                    }, dataSpecs['relational, category=big-text|value=qty']);

                    expect(chart.contentPanel.getLayout().paddings.left).toBe(0);
                    expect(chart.contentPanel.getLayout().size.width).toBe(600);
                });
            });

            // CDF-917
            describe("in an axis with a fixed categorical band layout", function() {
                it("should not declare overflow when it is absorbed by a fixed band layout that does not occupy " +
                   "the whole plot area", function() {

                    var chart = utils.createAndLayoutChart(pvc.BarChart, {
                        // Reset
                        animate: false,
                        interactive: true,
                        axisOffset: 0,
                        margins: 0,
                        paddings: 0,
                        contentPaddings: 0,
                        contentMargins: 0,

                        // ---
                        width:  600,
                        height: 400,

                        baseAxisBandSize: 15,
                        baseAxisBandSpacing: 5
                    }, dataSpecs['relational, category=date|value=qty, 4 categories']);

                    expect(chart.contentPanel.getLayout().paddings.width).toBe(0);
                });
            });

            // CDF-919
            describe("in a categorical axis with OverlappedLabelsMode is 'hide'", function() {

                it("should ignore hidden labels when determining label overflow", function() {

                    // The rightmost label is hidden

                    var chart = utils.createAndLayoutChart(pvc.BarChart, {
                        // Reset
                        animate: false,
                        interactive: true,
                        axisOffset: 0,
                        margins: 0,
                        paddings: 0,
                        contentPaddings: 0,
                        contentMargins: 0,

                        // ---
                        width:  300,
                        height: 200,

                        baseAxisFont: '16px sans-serif',
                        baseAxisOverlappedLabelsMode: 'hide'
                    }, dataSpecs['relational, category=date|value=qty, 4 categories']);

                    expect(chart.contentPanel.getLayout().paddings.right).toBe(0);
                });
            });
        });
    });
});
