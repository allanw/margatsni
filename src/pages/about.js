import React from "react"
import { rhythm } from "../utils/typography"
import Layout from "../layouts"

class About extends React.Component {
  render() {
    return (
      <Layout location={this.props.location}>
        <div
          css={{
            padding: rhythm(3 / 4),
          }}
        >
          <h1 data-testid="about-title">About Gatsbygram</h1>
          <p>
            This is a test.
          </p>
          <p>
            Another test.
          </p>
          <p>
            <a href="https://www.gatsbyjs.org/blog/gatsbygram-case-study/">
              Test 3
            </a>
          </p>
        </div>
      </Layout>
    )
  }
}

export default About
