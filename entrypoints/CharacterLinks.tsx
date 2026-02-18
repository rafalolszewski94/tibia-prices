import type { ReactElement } from 'react';

export type CharacterLink = { label: string; href: string };

type CharacterLinksProps = {
  links: CharacterLink[];
};

const TIBIA_STATIC = 'https://static.tibia.com/images/global/content';

const frameEdgeStyle = { backgroundImage: `url(${TIBIA_STATIC}/box-frame-edge.gif)` };
const headlineBorderStyle = {
  backgroundImage: `url(${TIBIA_STATIC}/table-headline-border.gif)`,
};
const frameVerticalStyle = {
  backgroundImage: `url(${TIBIA_STATIC}/box-frame-vertical.gif)`,
};

const CharacterLinks = ({ links }: CharacterLinksProps): ReactElement => (
  <div
    id="tibia-prices-character-links"
    className="TableContainer"
    role="region"
    aria-label="Quick links for this character"
  >
    <div className="CaptionContainer">
      <div className="CaptionInnerContainer">
        <span
          className="CaptionEdgeLeftTop"
          style={frameEdgeStyle}
          aria-hidden
        />
        <span
          className="CaptionEdgeRightTop"
          style={frameEdgeStyle}
          aria-hidden
        />
        <span
          className="CaptionBorderTop"
          style={headlineBorderStyle}
          aria-hidden
        />
        <span
          className="CaptionVerticalLeft"
          style={frameVerticalStyle}
          aria-hidden
        />
        <div className="Text">Quick Links</div>
        <span
          className="CaptionVerticalRight"
          style={frameVerticalStyle}
          aria-hidden
        />
        <span
          className="CaptionBorderBottom"
          style={headlineBorderStyle}
          aria-hidden
        />
        <span
          className="CaptionEdgeLeftBottom"
          style={frameEdgeStyle}
          aria-hidden
        />
        <span
          className="CaptionEdgeRightBottom"
          style={frameEdgeStyle}
          aria-hidden
        />
      </div>
    </div>
    <table className="Table3" cellPadding={0} cellSpacing={0}>
      <tbody>
        <tr>
          <td>
            <div className="TableScrollbarWrapper">
              <div className="TableScrollbarContainer" />
            </div>
            <div className="InnerTableContainer">
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td>
                      <div className="TableContentContainer ">
                        <table
                          className="TableContent"
                          width="100%"
                          style={{ border: '1px solid #faf0d7' }}
                        >
                          <tbody>
                            {links.map(({ label, href }, index) => (
                              <tr
                                key={href}
                                style={{
                                  backgroundColor:
                                    index % 2 === 0 ? '#D4C0A1' : '#F1E0C6',
                                }}
                              >
                                <td>
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    tabIndex={0}
                                    aria-label={`Open ${label}`}
                                  >
                                    {label}
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);

export default CharacterLinks;
