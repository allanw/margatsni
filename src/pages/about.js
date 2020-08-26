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
          <h1 data-testid="about-title">About margatsnI</h1>
          <p>
            It's Instagram backwards.
          </p>
        </div>
      </Layout>
    )
  }
}

export default About
